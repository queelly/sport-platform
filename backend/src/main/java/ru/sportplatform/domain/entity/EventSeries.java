package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.JoinMode;
import ru.sportplatform.domain.enums.Enums.SkillLevel;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "event_series")
public class EventSeries {

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

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "location_address", nullable = false, length = 250)
    private String locationAddress;

    private Double latitude;
    private Double longitude;

    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek; // 1 = Monday ... 7 = Sunday

    @Column(name = "start_time_local", nullable = false, length = 10)
    private String startTimeLocal; // HH:mm

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes = 90;

    @Enumerated(EnumType.STRING)
    @Column(name = "join_mode", nullable = false, length = 40)
    private JoinMode joinMode = JoinMode.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false, length = 40)
    private SkillLevel skillLevel = SkillLevel.ANY;

    @Column(name = "participation_conditions", length = 1000)
    private String participationConditions;

    @Column(name = "what_to_bring", length = 500)
    private String whatToBring;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

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
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getLocationAddress() { return locationAddress; }
    public void setLocationAddress(String locationAddress) { this.locationAddress = locationAddress; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public String getStartTimeLocal() { return startTimeLocal; }
    public void setStartTimeLocal(String startTimeLocal) { this.startTimeLocal = startTimeLocal; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public JoinMode getJoinMode() { return joinMode; }
    public void setJoinMode(JoinMode joinMode) { this.joinMode = joinMode; }
    public SkillLevel getSkillLevel() { return skillLevel; }
    public void setSkillLevel(SkillLevel skillLevel) { this.skillLevel = skillLevel; }
    public String getParticipationConditions() { return participationConditions; }
    public void setParticipationConditions(String participationConditions) { this.participationConditions = participationConditions; }
    public String getWhatToBring() { return whatToBring; }
    public void setWhatToBring(String whatToBring) { this.whatToBring = whatToBring; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
