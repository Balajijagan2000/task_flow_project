package com.taskflow.auth.service;

import com.taskflow.auth.dto.AuthResponse;
import com.taskflow.auth.dto.LoginRequest;
import com.taskflow.auth.dto.RegisterRequest;
import com.taskflow.auth.entity.User;
import com.taskflow.auth.repository.UserRepository;
import com.taskflow.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtTokenProvider);
    }

    @Test
    @DisplayName("Should successfully register a new user")
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("john_doe", "john@example.com", "password123", "USER");

        when(userRepository.existsByUsername("john_doe")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");

        User savedUser = new User("john_doe", "john@example.com", "hashedPassword", "ROLE_USER");
        savedUser.setId(1L);

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        when(jwtTokenProvider.generateToken(1L, "john_doe", "ROLE_USER")).thenReturn("dummy-jwt-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("john_doe", response.username());
        assertEquals("ROLE_USER", response.role());
        assertEquals("dummy-jwt-token", response.token());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should reject registration when username already exists")
    void testRegisterDuplicateUsername() {
        RegisterRequest request = new RegisterRequest("existing_user", "test@example.com", "password123", "USER");
        when(userRepository.existsByUsername("existing_user")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("Username is already taken"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully authenticate valid credentials")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("john_doe", "password123");
        User user = new User("john_doe", "john@example.com", "hashedPassword", "ROLE_USER");
        user.setId(1L);

        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);
        when(jwtTokenProvider.generateToken(1L, "john_doe", "ROLE_USER")).thenReturn("dummy-jwt-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("dummy-jwt-token", response.token());
        assertEquals(1L, response.userId());
    }

    @Test
    @DisplayName("Should throw BadCredentialsException on invalid password")
    void testLoginInvalidPassword() {
        LoginRequest request = new LoginRequest("john_doe", "wrongpassword");
        User user = new User("john_doe", "john@example.com", "hashedPassword", "ROLE_USER");

        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "hashedPassword")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }
}
