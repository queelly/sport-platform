package ru.sportplatform.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import ru.sportplatform.exception.ApiException;

import java.util.Optional;
import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<UserPrincipal> getCurrentPrincipalOptional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    public static UserPrincipal requirePrincipal() {
        return getCurrentPrincipalOptional()
                .orElseThrow(() -> ApiException.unauthorized("Необходимо войти в аккаунт для выполнения этого действия"));
    }

    public static UUID requireUserId() {
        return requirePrincipal().id();
    }

    public static void requireAdmin() {
        UserPrincipal p = requirePrincipal();
        if (!p.isAdmin()) {
            throw ApiException.forbidden("Доступ разрешён только администраторам платформы");
        }
    }
}
