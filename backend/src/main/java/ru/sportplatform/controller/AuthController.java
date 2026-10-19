package ru.sportplatform.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.security.JwtService;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "sp_refresh_token";
    private static final String ACCESS_COOKIE = "sp_access_token";

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register/user")
    public ResponseEntity<AuthResponse> registerUser(
            @Valid @RequestBody RegisterUserRequest req,
            HttpServletResponse response
    ) {
        AuthResponse auth = authService.registerUser(req);
        attachCookies(response, auth);
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/register/organization")
    public ResponseEntity<AuthResponse> registerOrganization(
            @Valid @RequestBody RegisterOrganizationRequest req,
            HttpServletResponse response
    ) {
        AuthResponse auth = authService.registerOrganization(req);
        attachCookies(response, auth);
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletResponse response
    ) {
        AuthResponse auth = authService.login(req);
        attachCookies(response, auth);
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody(required = false) RefreshTokenRequest body,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawRefresh = (body != null && body.refreshToken() != null && !body.refreshToken().isBlank())
                ? body.refreshToken()
                : extractRefreshCookie(request);
        AuthResponse auth = authService.refresh(rawRefresh);
        attachCookies(response, auth);
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) RefreshTokenRequest body,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawRefresh = (body != null && body.refreshToken() != null)
                ? body.refreshToken()
                : extractRefreshCookie(request);
        var currentId = SecurityUtils.getCurrentPrincipalOptional().map(p -> p.id()).orElse(null);
        authService.logout(rawRefresh, currentId);
        clearCookies(response);
        return ResponseEntity.ok(Map.of("message", "Вы успешно вышли из системы"));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe() {
        var principal = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(authService.getCurrentSessionInfo(principal.id()));
    }

    private void attachCookies(HttpServletResponse response, AuthResponse auth) {
        if (auth.refreshToken() != null) {
            ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, auth.refreshToken())
                    .httpOnly(true)
                    .path("/api/v1/auth")
                    .maxAge(jwtService.getRefreshTtlSeconds())
                    .sameSite("Lax")
                    .build();
            response.addHeader("Set-Cookie", refreshCookie.toString());
        }
        if (auth.accessToken() != null) {
            ResponseCookie accessCookie = ResponseCookie.from(ACCESS_COOKIE, auth.accessToken())
                    .httpOnly(true)
                    .path("/")
                    .maxAge(1800)
                    .sameSite("Lax")
                    .build();
            response.addHeader("Set-Cookie", accessCookie.toString());
        }
    }

    private void clearCookies(HttpServletResponse response) {
        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        ResponseCookie accessCookie = ResponseCookie.from(ACCESS_COOKIE, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", refreshCookie.toString());
        response.addHeader("Set-Cookie", accessCookie.toString());
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (REFRESH_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
