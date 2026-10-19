package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.EventStatus;
import ru.sportplatform.domain.enums.Enums.JoinMode;
import ru.sportplatform.domain.enums.Enums.SkillLevel;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "events")
public class Event {

    @Id
    private UUID id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 3000)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "sport_id", nullable = false)
    private Sport sport;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "organizer_user_id", nullable = false)
    private User organizer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "series_id")
    private EventSeries series;

    @Column(name = "occurrence_date")
    private LocalDate occurrenceDate;

    @Column(name = "is_recurring_occurrence", nullable = false)
    private boolean recurringOccurrence = false;

    @Column(name = "is_modified_occurrence", nullable = false)
    private boolean modifiedOccurrence = false;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "location_address", nullable = false, length = 250)
    private String locationAddress;

    private Double latitude;
    private Double longitude;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "join_mode", nullable = false, length = 40)
    private JoinMode joinMode = JoinMode.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false, length = 40)
    private SkillLevel skillLevel = SkillLevel.ANY;

    @Column(name = "activity_format", length = 80)
    private String activityFormat;

    @Column(name = "participation_conditions", length = 1000)
    private String participationConditions;

    @Column(name = "what_to_bring", length = 500)
    private String whatToBring;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EventStatus status = EventStatus.PUBLISHED;

    @Column(name = "moderation_reason", length = 1500)
    private String moderationReason;

    @Column(name = "cancellation_reason", length = 1500)
    private String cancellationReason;

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
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Sport getSport() { return sport; }
    public void setSport(Sport sport) { this.sport = sport; }
    public User getOrganizer() { return organizer; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public EventSeries getSeries() { return series; }
    public void setSeries(EventSeries series) { this.series = series; }
    public LocalDate getOccurrenceDate() { return occurrenceDate; }
    public void setOccurrenceDate(LocalDate occurrenceDate) { this.occurrenceDate = occurrenceDate; }
    public boolean isRecurringOccurrence() { return recurringOccurrence; }
    public void setRecurringOccurrence(boolean recurringOccurrence) { this.recurringOccurrence = recurringOccurrence; }
    public boolean isModifiedOccurrence() { return modifiedOccurrence; }
    public void setModifiedOccurrence(boolean modifiedOccurrence) { this.modifiedOccurrence = modifiedOccurrence; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getLocationAddress() { return locationAddress; }
    public void setLocationAddress(String locationAddress) { this.locationAddress = locationAddress; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }
    public JoinMode getJoinMode() { return joinMode; }
    public void setJoinMode(JoinMode joinMode) { this.joinMode = joinMode; }
    public SkillLevel getSkillLevel() { return skillLevel; }
    public void setSkillLevel(SkillLevel skillLevel) { this.skillLevel = skillLevel; }
    public String getActivityFormat() { return activityFormat; }
    public void setActivityFormat(String activityFormat) { this.activityFormat = activityFormat; }
    public String getParticipationConditions() { return participationConditions; }
    public void setParticipationConditions(String participationConditions) { this.participationConditions = participationConditions; }
    public String getWhatToBring() { return whatToBring; }
    public void setWhatToBring(String whatToBring) { this.whatToBring = whatToBring; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }
    public String getModerationReason() { return moderationReason; }
    public void setModerationReason(String moderationReason) { this.moderationReason = moderationReason; }
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
