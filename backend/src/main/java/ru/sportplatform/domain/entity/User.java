package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.GlobalRole;
import ru.sportplatform.domain.enums.Enums.VisibilityScope;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "global_role", nullable = false, length = 30)
    private GlobalRole globalRole = GlobalRole.USER;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String district;

    @Column(length = 1500)
    private String bio;

    @Column(name = "avatar_attachment_id")
    private UUID avatarAttachmentId;

    @Column(name = "preferred_formats", length = 300)
    private String preferredFormats;

    @Column(name = "preferred_schedule", length = 300)
    private String preferredSchedule;

    @Column(name = "show_in_partner_search", nullable = false)
    private boolean showInPartnerSearch = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "show_upcoming_events", nullable = false, length = 30)
    private VisibilityScope showUpcomingEvents = VisibilityScope.ALL;

    @Enumerated(EnumType.STRING)
    @Column(name = "show_friends_list", nullable = false, length = 30)
    private VisibilityScope showFriendsList = VisibilityScope.ALL;

    @Column(name = "notify_in_app", nullable = false)
    private boolean notifyInApp = true;

    @Column(name = "notify_vk", nullable = false)
    private boolean notifyVk = true;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "terms_accepted", nullable = false)
    private boolean termsAccepted = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public GlobalRole getGlobalRole() { return globalRole; }
    public void setGlobalRole(GlobalRole globalRole) { this.globalRole = globalRole; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public UUID getAvatarAttachmentId() { return avatarAttachmentId; }
    public void setAvatarAttachmentId(UUID avatarAttachmentId) { this.avatarAttachmentId = avatarAttachmentId; }
    public String getPreferredFormats() { return preferredFormats; }
    public void setPreferredFormats(String preferredFormats) { this.preferredFormats = preferredFormats; }
    public String getPreferredSchedule() { return preferredSchedule; }
    public void setPreferredSchedule(String preferredSchedule) { this.preferredSchedule = preferredSchedule; }
    public boolean isShowInPartnerSearch() { return showInPartnerSearch; }
    public void setShowInPartnerSearch(boolean showInPartnerSearch) { this.showInPartnerSearch = showInPartnerSearch; }
    public VisibilityScope getShowUpcomingEvents() { return showUpcomingEvents; }
    public void setShowUpcomingEvents(VisibilityScope showUpcomingEvents) { this.showUpcomingEvents = showUpcomingEvents; }
    public VisibilityScope getShowFriendsList() { return showFriendsList; }
    public void setShowFriendsList(VisibilityScope showFriendsList) { this.showFriendsList = showFriendsList; }
    public boolean isNotifyInApp() { return notifyInApp; }
    public void setNotifyInApp(boolean notifyInApp) { this.notifyInApp = notifyInApp; }
    public boolean isNotifyVk() { return notifyVk; }
    public void setNotifyVk(boolean notifyVk) { this.notifyVk = notifyVk; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(boolean termsAccepted) { this.termsAccepted = termsAccepted; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
