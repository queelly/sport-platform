package ru.sportplatform.security;

import ru.sportplatform.domain.enums.Enums.GlobalRole;

import java.util.UUID;

public record UserPrincipal(
        UUID id,
        String email,
        String displayName,
        GlobalRole role
) {
    public boolean isAdmin() {
        return role == GlobalRole.ADMIN;
    }
}
