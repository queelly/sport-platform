package ru.sportplatform.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.*;
import ru.sportplatform.domain.enums.Enums.*;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.*;
import ru.sportplatform.security.UserPrincipal;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class EventService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Europe/Moscow");
    private static final DateTimeFormatter ICS_FMT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    private final EventRepository eventRepository;
    private final EventSeriesRepository seriesRepository;
    private final EventParticipationRepository participationRepository;
    private final SportRepository sportRepository;
    private final SportService sportService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationSubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final EventReminderLogRepository reminderLogRepository;

    @Value("${app.recurring.weeks-ahead:4}")
    private int recurringWeeksAhead;

    @Value("${app.reminders.first-hours:24}")
    private int firstReminderHours;

    @Value("${app.reminders.second-hours:2}")
    private int secondReminderHours;

    public EventService(
            EventRepository eventRepository,
            EventSeriesRepository seriesRepository,
            EventParticipationRepository participationRepository,
            SportRepository sportRepository,
            SportService sportService,
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            OrganizationSubscriptionRepository subscriptionRepository,
            NotificationService notificationService,
            AuditLogService auditLogService,
            EventReminderLogRepository reminderLogRepository
    ) {
        this.eventRepository = eventRepository;
        this.seriesRepository = seriesRepository;
        this.participationRepository = participationRepository;
        this.sportRepository = sportRepository;
        this.sportService = sportService;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.reminderLogRepository = reminderLogRepository;
    }

    @Transactional
    public EventDetailDto createEvent(UUID creatorUserId, CreateEventRequest req) {
        User creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        if (req.startsAt().isBefore(Instant.now().minus(5, ChronoUnit.MINUTES))) {
            throw ApiException.badRequest("Нельзя создать мероприятие в прошлом. Пожалуйста, укажите будущую дату и время начала.");
        }

        Sport sport;
        if (req.newSportName() != null && !req.newSportName().isBlank()) {
            sport = sportService.getOrCreateByName(req.newSportName(), req.newSportCategory(), creatorUserId);
        } else if (req.sportId() != null) {
            sport = sportRepository.findById(req.sportId())
                    .orElseThrow(() -> ApiException.notFound("Выбранный вид спорта не найден"));
        } else {
            throw ApiException.badRequest("Выберите вид спорта из справочника или введите название нового направления");
        }

        Organization organization = null;
        if (req.organizationId() != null) {
            organization = organizationRepository.findById(req.organizationId())
                    .orElseThrow(() -> ApiException.notFound("Организация не найдена"));
            if (!canUserManageOrg(organization, creatorUserId) && creator.getGlobalRole() != GlobalRole.ADMIN) {
                throw ApiException.forbidden("Вы не являетесь создателем или администратором выбранного сообщества");
            }
            if (organization.getStatus() != OrganizationStatus.APPROVED) {
                throw ApiException.forbidden("Невозможно опубликовать мероприятие от имени организации до её одобрения администратором (текущий статус: " + organization.getStatus() + ")");
            }
        }

        Instant endsAt = req.endsAt() != null ? req.endsAt() : req.startsAt().plus(90, ChronoUnit.MINUTES);
        if (!endsAt.isAfter(req.startsAt())) {
            endsAt = req.startsAt().plus(60, ChronoUnit.MINUTES);
        }

        if (req.maxParticipants() != null && req.maxParticipants() < 2) {
            throw ApiException.badRequest("Лимит участников должен быть не менее 2 человек");
        }

        Event primaryEvent;
        if (req.recurring()) {
            EventSeries series = new EventSeries();
            series.setTitle(req.title().trim());
            series.setDescription(req.description().trim());
            series.setSport(sport);
            series.setOrganizer(creator);
            series.setOrganization(organization);
            series.setCity(req.city().trim());
            series.setLocationAddress(req.locationAddress().trim());
            series.setLatitude(req.latitude());
            series.setLongitude(req.longitude());
            series.setCoverAttachmentId(req.coverAttachmentId());

            ZonedDateTime zdt = req.startsAt().atZone(DEFAULT_ZONE);
            int dow = req.recurringDayOfWeek() != null ? req.recurringDayOfWeek() : zdt.getDayOfWeek().getValue();
            String timeLocal = req.recurringStartTimeLocal() != null && !req.recurringStartTimeLocal().isBlank()
                    ? req.recurringStartTimeLocal()
                    : String.format("%02d:%02d", zdt.getHour(), zdt.getMinute());
            int durationMin = req.recurringDurationMinutes() != null && req.recurringDurationMinutes() > 15
                    ? req.recurringDurationMinutes()
                    : (int) Duration.between(req.startsAt(), endsAt).toMinutes();

            series.setDayOfWeek(dow);
            series.setStartTimeLocal(timeLocal);
            series.setDurationMinutes(Math.max(durationMin, 30));
            series.setJoinMode(req.joinMode());
            series.setSkillLevel(req.skillLevel());
            series.setParticipationConditions(req.participationConditions());
            series.setWhatToBring(req.whatToBring());
            series.setMaxParticipants(req.maxParticipants());
            series.setStartDate(req.recurringStartDate() != null ? req.recurringStartDate() : zdt.toLocalDate());
            series.setEndDate(req.recurringEndDate());
            series.setActive(true);
            series = seriesRepository.save(series);

            List<Event> generated = generateOccurrencesForSeries(series, recurringWeeksAhead);
            if (generated.isEmpty()) {
                primaryEvent = buildEventFromSeries(series, series.getStartDate(), req.startsAt(), endsAt);
                primaryEvent = eventRepository.save(primaryEvent);
            } else {
                primaryEvent = generated.getFirst();
            }
        } else {
            primaryEvent = new Event();
            primaryEvent.setTitle(req.title().trim());
            primaryEvent.setDescription(req.description().trim());
            primaryEvent.setSport(sport);
            primaryEvent.setOrganizer(creator);
            primaryEvent.setOrganization(organization);
            primaryEvent.setCity(req.city().trim());
            primaryEvent.setLocationAddress(req.locationAddress().trim());
            primaryEvent.setLatitude(req.latitude());
            primaryEvent.setLongitude(req.longitude());
            primaryEvent.setStartsAt(req.startsAt());
            primaryEvent.setEndsAt(endsAt);
            primaryEvent.setJoinMode(req.joinMode());
            primaryEvent.setSkillLevel(req.skillLevel());
            primaryEvent.setActivityFormat(req.activityFormat());
            primaryEvent.setParticipationConditions(req.participationConditions());
            primaryEvent.setWhatToBring(req.whatToBring());
            primaryEvent.setMaxParticipants(req.maxParticipants());
            primaryEvent.setCoverAttachmentId(req.coverAttachmentId());
            primaryEvent.setStatus(EventStatus.PUBLISHED);
            primaryEvent = eventRepository.save(primaryEvent);
        }

        // Если мероприятие опубликовано от имени одобренной организации — уведомим подписчиков клуба
        if (organization != null) {
            Organization finalOrg = organization;
            Event finalEv = primaryEvent;
            List<OrganizationSubscription> subs = subscriptionRepository.findByOrganizationId(organization.getId());
            for (OrganizationSubscription sub : subs) {
                if (!sub.getUser().getId().equals(creatorUserId)) {
                    notificationService.notifyUser(
                            sub.getUser(),
                            NotificationType.CLUB_NEW_EVENT,
                            "Новое мероприятие клуба «" + finalOrg.getName() + "»",
                            "Опубликована встреча «" + finalEv.getTitle() + "» (" + sport.getName() + "). Присоединяйтесь!",
                            "/events/" + finalEv.getId()
                    );
                }
            }
        }

        UserPrincipal principal = new UserPrincipal(creator.getId(), creator.getEmail(), creator.getDisplayName(), creator.getGlobalRole());
        return getEventDetail(primaryEvent.getId(), principal);
    }

    @Transactional
    public List<Event> generateOccurrencesForSeries(EventSeries series, int weeksAhead) {
        if (!series.isActive()) return List.of();
        List<Event> result = new ArrayList<>();

        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        LocalDate cursor = series.getStartDate().isAfter(today) ? series.getStartDate() : today;
        LocalDate horizon = cursor.plusWeeks(weeksAhead);
        if (series.getEndDate() != null && series.getEndDate().isBefore(horizon)) {
            horizon = series.getEndDate();
        }

        String[] parts = series.getStartTimeLocal().split(":");
        int hour = parts.length > 0 ? Integer.parseInt(parts[0]) : 10;
        int minute = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;

        while (!cursor.isAfter(horizon)) {
            if (cursor.getDayOfWeek().getValue() == series.getDayOfWeek()) {
                LocalDate occDate = cursor;
                Optional<Event> existing = eventRepository.findBySeriesIdAndOccurrenceDate(series.getId(), occDate);
                if (existing.isEmpty()) {
                    ZonedDateTime startZdt = ZonedDateTime.of(occDate, LocalTime.of(hour, minute), DEFAULT_ZONE);
                    Instant startInst = startZdt.toInstant();
                    Instant endInst = startInst.plus(series.getDurationMinutes(), ChronoUnit.MINUTES);
                    Event occ = buildEventFromSeries(series, occDate, startInst, endInst);
                    result.add(eventRepository.save(occ));
                } else {
                    result.add(existing.get());
                }
            }
            cursor = cursor.plusDays(1);
        }
        return result;
    }

    private Event buildEventFromSeries(EventSeries series, LocalDate occDate, Instant startInst, Instant endInst) {
        Event occ = new Event();
        occ.setTitle(series.getTitle());
        occ.setDescription(series.getDescription());
        occ.setSport(series.getSport());
        occ.setOrganizer(series.getOrganizer());
        occ.setOrganization(series.getOrganization());
        occ.setSeries(series);
        occ.setOccurrenceDate(occDate);
        occ.setRecurringOccurrence(true);
        occ.setModifiedOccurrence(false);
        occ.setCity(series.getCity());
        occ.setLocationAddress(series.getLocationAddress());
        occ.setLatitude(series.getLatitude());
        occ.setLongitude(series.getLongitude());
        occ.setStartsAt(startInst);
        occ.setEndsAt(endInst);
        occ.setJoinMode(series.getJoinMode());
        occ.setSkillLevel(series.getSkillLevel());
        occ.setActivityFormat("Еженедельно");
        occ.setParticipationConditions(series.getParticipationConditions());
        occ.setWhatToBring(series.getWhatToBring());
        occ.setMaxParticipants(series.getMaxParticipants());
        occ.setCoverAttachmentId(series.getCoverAttachmentId());
        occ.setStatus(EventStatus.PUBLISHED);
        return occ;
    }

    @Transactional(readOnly = true)
    public List<EventCardDto> searchEvents(
            UUID sportId,
            String city,
            JoinMode joinMode,
            SkillLevel skillLevel,
            Boolean recurring,
            Boolean onlyAvailableSpots,
            String query,
            UserPrincipal viewer
    ) {
        List<Event> events = eventRepository.findByStatusOrderByStartsAtAsc(EventStatus.PUBLISHED);
        return events.stream()
                .filter(e -> sportId == null || e.getSport().getId().equals(sportId))
                .filter(e -> city == null || city.isBlank() || fuzzyCityMatches(city, e.getCity()))
                .filter(e -> joinMode == null || e.getJoinMode() == joinMode)
                .filter(e -> skillLevel == null || e.getSkillLevel() == skillLevel || e.getSkillLevel() == SkillLevel.ANY)
                .filter(e -> recurring == null || e.isRecurringOccurrence() == recurring)
                .filter(e -> {
                    if (query == null || query.isBlank()) return true;
                    return fuzzyTextMatches(
                            query,
                            e.getTitle(),
                            e.getDescription(),
                            e.getLocationAddress(),
                            e.getCity(),
                            e.getSport().getName(),
                            e.getOrganization() != null ? e.getOrganization().getName() : "",
                            e.getOrganizer().getDisplayName()
                    );
                })
                .map(e -> toCardDto(e, viewer))
                .filter(dto -> {
                    if (onlyAvailableSpots == null || !onlyAvailableSpots) return true;
                    return dto.maxParticipants() == null || dto.confirmedParticipantsCount() < dto.maxParticipants();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailDto getEventDetail(UUID eventId, UserPrincipal viewer) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));

        boolean isOrganizer = viewer != null && canManageEvent(event, viewer);
        boolean isAdmin = viewer != null && viewer.isAdmin();

        List<EventParticipation> allParts = participationRepository.findByEventIdOrderByCreatedAtAsc(eventId);
        List<ParticipantDto> confirmed = allParts.stream()
                .filter(p -> p.getStatus() == ParticipationStatus.CONFIRMED)
                .map(this::toParticipantDto)
                .toList();

        List<ParticipantDto> pending = (isOrganizer || isAdmin)
                ? allParts.stream()
                .filter(p -> p.getStatus() == ParticipationStatus.PENDING)
                .map(this::toParticipantDto)
                .toList()
                : List.of();

        List<ParticipantDto> waitlist = allParts.stream()
                .filter(p -> p.getStatus() == ParticipationStatus.WAITLISTED)
                .map(this::toParticipantDto)
                .toList();

        List<EventCardDto> seriesOccurrences = event.getSeries() != null
                ? eventRepository.findBySeriesIdOrderByStartsAtAsc(event.getSeries().getId())
                .stream()
                .map(occ -> toCardDto(occ, viewer))
                .toList()
                : List.of();

        return new EventDetailDto(
                toCardDto(event, viewer),
                confirmed,
                pending,
                waitlist,
                seriesOccurrences
        );
    }

    @Transactional
    public EventDetailDto joinOrApply(UUID eventId, UserPrincipal viewer, String comment) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));

        if (canManageEvent(event, viewer)) {
            throw ApiException.conflict("Вы являетесь организатором этого мероприятия и уже участвуете в его проведении");
        }

        if (event.getStatus() == EventStatus.UNPUBLISHED_BY_ADMIN) {
            throw ApiException.conflict("Мероприятие снято с публикации администратором. Запись невозможна.");
        }
        if (event.getStatus() == EventStatus.CANCELLED_BY_ORGANIZER) {
            throw ApiException.conflict("Мероприятие отменено организатором. Запись закрыта.");
        }
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw ApiException.conflict("Запись на это мероприятие закрыта");
        }

        User user = userRepository.findById(viewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        Optional<EventParticipation> existingOpt = participationRepository.findByEventIdAndUserId(eventId, user.getId());
        if (existingOpt.isPresent()) {
            EventParticipation existing = existingOpt.get();
            if (existing.getStatus() == ParticipationStatus.CONFIRMED || existing.getStatus() == ParticipationStatus.PENDING || existing.getStatus() == ParticipationStatus.WAITLISTED) {
                throw ApiException.conflict("У вас уже есть активная запись или заявка на это мероприятие (статус: " + existing.getStatus() + ")");
            }
        }

        // Проверка пересечения мероприятий по времени (не подтверждаем автоматически при конфликте расписания)
        Optional<Event> conflictOpt = findConflictingEvent(user.getId(), event);
        if (conflictOpt.isPresent()) {
            Event conflict = conflictOpt.get();
            throw ApiException.conflict("Конфликт расписания: в это же время у вас уже запланировано участие во встрече «"
                    + conflict.getTitle() + "» (" + formatEventInterval(conflict) + "). "
                    + "Чтобы записаться на эту встречу, сначала отмените пересекающуюся запись.");
        }

        EventParticipation part = existingOpt.orElseGet(() -> {
            EventParticipation p = new EventParticipation();
            p.setEvent(event);
            p.setUser(user);
            return p;
        });
        part.setRequestComment(comment);

        long confirmedCount = participationRepository.countByEventIdAndStatus(eventId, ParticipationStatus.CONFIRMED);
        boolean isFull = event.getMaxParticipants() != null && confirmedCount >= event.getMaxParticipants();

        if (event.getJoinMode() == JoinMode.OPEN) {
            if (isFull) {
                part.setStatus(ParticipationStatus.WAITLISTED);
                participationRepository.save(part);
            } else {
                part.setStatus(ParticipationStatus.CONFIRMED);
                participationRepository.save(part);
                if (!event.getOrganizer().getId().equals(user.getId())) {
                    notificationService.notifyUser(
                            event.getOrganizer(),
                            NotificationType.PARTICIPATION_APPROVED,
                            "Новый участник на «" + event.getTitle() + "»",
                            "Пользователь " + user.getDisplayName() + " присоединился к вашему мероприятию.",
                            "/events/" + event.getId()
                    );
                }
            }
        } else {
            part.setStatus(ParticipationStatus.PENDING);
            participationRepository.save(part);
            notificationService.notifyUser(
                    event.getOrganizer(),
                    NotificationType.PARTICIPATION_REQUESTED,
                    "Новая заявка на участие: «" + event.getTitle() + "»",
                    user.getDisplayName() + " подал(а) заявку на участие. Рассмотрите заявку в карточке мероприятия.",
                    "/events/" + event.getId()
            );
        }

        return getEventDetail(eventId, viewer);
    }

    @Transactional
    public EventDetailDto decideParticipation(UUID eventId, UUID participationId, UserPrincipal organizerViewer, ParticipationDecisionRequest req) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));

        if (!canManageEvent(event, organizerViewer)) {
            throw ApiException.forbidden("Только организатор мероприятия или администратор сообщества может рассматривать заявки участников");
        }

        EventParticipation part = participationRepository.findById(participationId)
                .orElseThrow(() -> ApiException.notFound("Заявка не найдена"));

        if (!part.getEvent().getId().equals(eventId)) {
            throw ApiException.badRequest("Заявка не относится к указанному мероприятию");
        }

        if (part.getUser().getId().equals(organizerViewer.id()) || part.getUser().getId().equals(event.getOrganizer().getId())) {
            throw ApiException.conflict("Организатор не может подавать или подтверждать заявку самому себе");
        }

        if (req.decision() != ParticipationStatus.CONFIRMED && req.decision() != ParticipationStatus.REJECTED) {
            throw ApiException.badRequest("Допустимые решения по заявке: CONFIRMED (принять) или REJECTED (отклонить)");
        }

        if (req.decision() == ParticipationStatus.CONFIRMED) {
            Optional<Event> conflictOpt = findConflictingEvent(part.getUser().getId(), event);
            if (conflictOpt.isPresent()) {
                Event conflict = conflictOpt.get();
                throw ApiException.conflict("Конфликт расписания у участника: в это время у пользователя уже подтверждено участие во встрече «"
                        + conflict.getTitle() + "» (" + formatEventInterval(conflict) + ").");
            }
            if (event.getMaxParticipants() != null) {
                long confirmedCount = participationRepository.countByEventIdAndStatus(eventId, ParticipationStatus.CONFIRMED);
                if (confirmedCount >= event.getMaxParticipants() && part.getStatus() != ParticipationStatus.CONFIRMED) {
                    throw ApiException.conflict("Достигнут максимальный лимит участников (" + event.getMaxParticipants() + ")");
                }
            }
        }

        part.setStatus(req.decision());
        part.setOrganizerComment(req.comment());
        participationRepository.save(part);

        if (req.decision() == ParticipationStatus.CONFIRMED) {
            notificationService.notifyUser(
                    part.getUser(),
                    NotificationType.PARTICIPATION_APPROVED,
                    "Ваша заявка одобрена!",
                    "Организатор подтвердил ваше участие в мероприятии «" + event.getTitle() + "»."
                            + (req.comment() != null && !req.comment().isBlank() ? " Комментарий: " + req.comment() : ""),
                    "/events/" + event.getId()
            );
        } else {
            notificationService.notifyUser(
                    part.getUser(),
                    NotificationType.PARTICIPATION_REJECTED,
                    "Заявка на «" + event.getTitle() + "» отклонена",
                    "К сожалению, организатор отклонил вашу заявку."
                            + (req.comment() != null && !req.comment().isBlank() ? " Причина: " + req.comment() : ""),
                    "/events/" + event.getId()
            );
        }

        return getEventDetail(eventId, organizerViewer);
    }

    @Transactional
    public EventDetailDto cancelMyParticipation(UUID eventId, UserPrincipal viewer) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));
        EventParticipation part = participationRepository.findByEventIdAndUserId(eventId, viewer.id())
                .orElseThrow(() -> ApiException.notFound("Ваша запись на мероприятие не найдена"));

        boolean wasConfirmed = part.getStatus() == ParticipationStatus.CONFIRMED;
        part.setStatus(ParticipationStatus.CANCELLED_BY_USER);
        participationRepository.save(part);

        if (wasConfirmed && event.getJoinMode() == JoinMode.OPEN) {
            List<EventParticipation> waitlist = participationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(eventId, ParticipationStatus.WAITLISTED);
            for (EventParticipation candidate : waitlist) {
                if (findConflictingEvent(candidate.getUser().getId(), event).isEmpty()) {
                    candidate.setStatus(ParticipationStatus.CONFIRMED);
                    participationRepository.save(candidate);

                    notificationService.notifyUser(
                            candidate.getUser(),
                            NotificationType.WAITLIST_PROMOTED,
                            "Освободилось место на «" + event.getTitle() + "»!",
                            "Вы автоматически переведены из листа ожидания в основной состав участников.",
                            "/events/" + event.getId()
                    );
                    break;
                }
            }
        }

        return getEventDetail(eventId, viewer);
    }

    @Transactional
    public EventDetailDto updateEvent(UUID eventId, UserPrincipal viewer, UpdateEventRequest req) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));
        if (!canManageEvent(event, viewer)) {
            throw ApiException.forbidden("Вы не можете редактировать чужое мероприятие");
        }

        if (!event.getStartsAt().equals(req.startsAt()) && req.startsAt().isBefore(Instant.now().minus(5, ChronoUnit.MINUTES))) {
            throw ApiException.badRequest("Нельзя перенести мероприятие в прошлое. Пожалуйста, укажите будущую дату и время начала.");
        }

        if (req.maxParticipants() != null && req.maxParticipants() < 2) {
            throw ApiException.badRequest("Лимит участников должен быть не менее 2 человек");
        }

        boolean timeOrPlaceChanged = !event.getStartsAt().equals(req.startsAt())
                || !event.getLocationAddress().equals(req.locationAddress().trim());

        if (req.sportId() != null) {
            sportRepository.findById(req.sportId()).ifPresent(event::setSport);
        }

        event.setTitle(req.title().trim());
        event.setDescription(req.description().trim());
        event.setCity(req.city().trim());
        event.setLocationAddress(req.locationAddress().trim());
        event.setLatitude(req.latitude());
        event.setLongitude(req.longitude());
        event.setStartsAt(req.startsAt());
        event.setEndsAt(req.endsAt() != null && req.endsAt().isAfter(req.startsAt())
                ? req.endsAt()
                : req.startsAt().plus(90, ChronoUnit.MINUTES));
        event.setJoinMode(req.joinMode());
        event.setSkillLevel(req.skillLevel());
        event.setActivityFormat(req.activityFormat());
        event.setParticipationConditions(req.participationConditions());
        event.setWhatToBring(req.whatToBring());
        event.setMaxParticipants(req.maxParticipants());
        if (Boolean.TRUE.equals(req.removeCoverImage())) {
            event.setCoverAttachmentId(null);
            if (event.getSeries() != null) {
                event.getSeries().setCoverAttachmentId(null);
                seriesRepository.save(event.getSeries());
            }
        } else if (req.coverAttachmentId() != null) {
            event.setCoverAttachmentId(req.coverAttachmentId());
        }
        if (event.isRecurringOccurrence()) {
            event.setModifiedOccurrence(true);
        }
        eventRepository.save(event);

        if (timeOrPlaceChanged) {
            List<EventParticipation> confirmed = participationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(eventId, ParticipationStatus.CONFIRMED);
            for (EventParticipation p : confirmed) {
                notificationService.notifyUser(
                        p.getUser(),
                        NotificationType.EVENT_UPDATED,
                        "Изменились детали встречи «" + event.getTitle() + "»",
                        "Организатор обновил время или место проведения встречи (" + event.getCity() + ", " + event.getLocationAddress() + ").",
                        "/events/" + event.getId()
                );
            }
        }

        return getEventDetail(eventId, viewer);
    }

    @Transactional
    public void deleteEventByOrganizer(UUID eventId, UserPrincipal viewer) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));
        if (!canManageEvent(event, viewer)) {
            throw ApiException.forbidden("Только организатор может удалить мероприятие");
        }
        notifyParticipantsAboutCancellation(event, "Мероприятие удалено организатором");
        eventRepository.delete(event);
    }

    private Optional<Event> findConflictingEvent(UUID userId, Event target) {
        Instant startA = target.getStartsAt();
        Instant endA = target.getEndsAt() != null ? target.getEndsAt() : startA.plus(90, ChronoUnit.MINUTES);

        // 1. Проверим подтверждённые записи пользователя
        List<EventParticipation> myParts = participationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (EventParticipation p : myParts) {
            if (p.getStatus() != ParticipationStatus.CONFIRMED) continue;
            Event other = p.getEvent();
            if (other.getId().equals(target.getId()) || other.getStatus() != EventStatus.PUBLISHED) continue;
            Instant startB = other.getStartsAt();
            Instant endB = other.getEndsAt() != null ? other.getEndsAt() : startB.plus(90, ChronoUnit.MINUTES);
            if (startA.isBefore(endB) && endA.isAfter(startB)) {
                return Optional.of(other);
            }
        }

        // 2. Проверим мероприятия, которые пользователь сам организует
        List<Event> organized = eventRepository.findByOrganizerIdOrderByStartsAtAsc(userId);
        for (Event other : organized) {
            if (other.getId().equals(target.getId()) || other.getStatus() != EventStatus.PUBLISHED) continue;
            Instant startB = other.getStartsAt();
            Instant endB = other.getEndsAt() != null ? other.getEndsAt() : startB.plus(90, ChronoUnit.MINUTES);
            if (startA.isBefore(endB) && endA.isAfter(startB)) {
                return Optional.of(other);
            }
        }

        return Optional.empty();
    }

    private String formatEventInterval(Event e) {
        DateTimeFormatter fmtDate = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(DEFAULT_ZONE);
        DateTimeFormatter fmtTime = DateTimeFormatter.ofPattern("HH:mm").withZone(DEFAULT_ZONE);
        Instant end = e.getEndsAt() != null ? e.getEndsAt() : e.getStartsAt().plus(90, ChronoUnit.MINUTES);
        return fmtDate.format(e.getStartsAt()) + "–" + fmtTime.format(end) + " МСК";
    }

    @Transactional
    public EventDetailDto cancelEventByOrganizer(UUID eventId, UserPrincipal viewer, CancelEventRequest req) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));
        if (!canManageEvent(event, viewer)) {
            throw ApiException.forbidden("Только организатор может отменить мероприятие");
        }

        String reason = req.reason() != null && !req.reason().isBlank() ? req.reason().trim() : "Отменено организатором";

        if (req.cancelEntireSeries() && event.getSeries() != null) {
            EventSeries series = event.getSeries();
            series.setActive(false);
            seriesRepository.save(series);

            List<Event> seriesEvents = eventRepository.findBySeriesIdOrderByStartsAtAsc(series.getId());
            for (Event occ : seriesEvents) {
                if (occ.getStartsAt().isAfter(Instant.now()) && occ.getStatus() == EventStatus.PUBLISHED) {
                    occ.setStatus(EventStatus.CANCELLED_BY_ORGANIZER);
                    occ.setCancellationReason(reason);
                    eventRepository.save(occ);
                    notifyParticipantsAboutCancellation(occ, reason);
                }
            }
        } else {
            event.setStatus(EventStatus.CANCELLED_BY_ORGANIZER);
            event.setCancellationReason(reason);
            eventRepository.save(event);
            notifyParticipantsAboutCancellation(event, reason);
        }

        return getEventDetail(eventId, viewer);
    }

    @Transactional
    public EventDetailDto restoreEventByOrganizer(UUID eventId, UserPrincipal viewer) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));
        if (!canManageEvent(event, viewer)) {
            throw ApiException.forbidden("Только организатор может возобновить встречу");
        }
        if (event.getStatus() == EventStatus.UNPUBLISHED_BY_ADMIN && !viewer.isAdmin()) {
            throw ApiException.forbidden("Мероприятие снято с публикации администратором. Обратитесь в поддержку или к модератору.");
        }
        event.setStatus(EventStatus.PUBLISHED);
        event.setCancellationReason(null);
        eventRepository.save(event);
        return getEventDetail(eventId, viewer);
    }

    @Transactional
    public EventDetailDto unpublishEventByAdmin(UUID eventId, UserPrincipal adminViewer, String reason) {
        User admin = userRepository.findById(adminViewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Администратор не найден"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));

        if (event.getStatus() == EventStatus.UNPUBLISHED_BY_ADMIN) {
            throw ApiException.conflict("Мероприятие уже снято с публикации");
        }

        String prevState = event.getStatus().name();
        event.setStatus(EventStatus.UNPUBLISHED_BY_ADMIN);
        event.setModerationReason(reason);
        eventRepository.save(event);

        auditLogService.record(
                admin,
                "UNPUBLISH_EVENT",
                "EVENT",
                event.getId(),
                prevState,
                EventStatus.UNPUBLISHED_BY_ADMIN.name(),
                reason
        );

        notificationService.notifyUser(
                event.getOrganizer(),
                NotificationType.EVENT_UNPUBLISHED_BY_ADMIN,
                "Ваше мероприятие «" + event.getTitle() + "» снято с публикации",
                "Причина модерации: " + reason,
                "/events/" + event.getId()
        );

        List<EventParticipation> confirmed = participationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(eventId, ParticipationStatus.CONFIRMED);
        for (EventParticipation p : confirmed) {
            if (!p.getUser().getId().equals(event.getOrganizer().getId())) {
                notificationService.notifyUser(
                        p.getUser(),
                        NotificationType.EVENT_UNPUBLISHED_BY_ADMIN,
                        "Мероприятие «" + event.getTitle() + "» снято с публикации",
                        "Мероприятие было скрыто модератором платформы. Причина: " + reason,
                        "/events/" + event.getId()
                );
            }
        }

        return getEventDetail(eventId, adminViewer);
    }

    @Transactional
    public EventDetailDto republishEventByAdmin(UUID eventId, UserPrincipal adminViewer, String reason) {
        User admin = userRepository.findById(adminViewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Администратор не найден"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));

        if (event.getStatus() == EventStatus.PUBLISHED) {
            throw ApiException.conflict("Мероприятие уже опубликовано");
        }

        String prevState = event.getStatus().name();
        event.setStatus(EventStatus.PUBLISHED);
        event.setModerationReason(null);
        eventRepository.save(event);

        auditLogService.record(
                admin,
                "REPUBLISH_EVENT",
                "EVENT",
                event.getId(),
                prevState,
                EventStatus.PUBLISHED.name(),
                reason != null && !reason.isBlank() ? reason : "Возвращено в публикацию администратором"
        );

        notificationService.notifyUser(
                event.getOrganizer(),
                NotificationType.EVENT_UPDATED,
                "Мероприятие «" + event.getTitle() + "» возвращено в публикацию!",
                "Администратор восстановил публикацию вашего мероприятия в каталоге.",
                "/events/" + event.getId()
        );

        return getEventDetail(eventId, adminViewer);
    }

    @Transactional(readOnly = true)
    public List<EventCardDto> listAllEventsForAdmin(UserPrincipal adminViewer) {
        return eventRepository.findAllByOrderByStartsAtAsc()
                .stream()
                .map(e -> toCardDto(e, adminViewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventCardDto> listMyOrganizedEvents(UserPrincipal viewer) {
        return eventRepository.findByOrganizerIdOrderByStartsAtAsc(viewer.id())
                .stream()
                .map(e -> toCardDto(e, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventCardDto> listMyParticipations(UserPrincipal viewer) {
        return participationRepository.findByUserIdOrderByCreatedAtDesc(viewer.id())
                .stream()
                .filter(p -> p.getStatus() != ParticipationStatus.CANCELLED_BY_USER)
                .map(p -> toCardDto(p.getEvent(), viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventCardDto> listOrganizationEvents(UUID orgId, UserPrincipal viewer) {
        boolean privileged = viewer != null && viewer.isAdmin();
        if (!privileged && viewer != null) {
            privileged = organizationRepository.findById(orgId)
                    .map(o -> canUserManageOrg(o, viewer.id()))
                    .orElse(false);
        }
        List<Event> list = privileged
                ? eventRepository.findByOrganizationIdOrderByStartsAtAsc(orgId)
                : eventRepository.findByOrganizationIdAndStatusOrderByStartsAtAsc(orgId, EventStatus.PUBLISHED);
        return list.stream().map(e -> toCardDto(e, viewer)).toList();
    }

    @Transactional(readOnly = true)
    public String generateIcsCalendar(UUID eventId) {
        Event e = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Мероприятие не найдено"));
        String dtStart = ICS_FMT.format(e.getStartsAt());
        String dtEnd = ICS_FMT.format(e.getEndsAt());
        String now = ICS_FMT.format(Instant.now());
        String cleanDesc = e.getDescription().replace("\r", " ").replace("\n", "\\n");
        return "BEGIN:VCALENDAR\r\n"
                + "VERSION:2.0\r\n"
                + "PRODID:-//SportPlatform//TochkaSbora//RU\r\n"
                + "BEGIN:VEVENT\r\n"
                + "UID:event-" + e.getId() + "@sportplatform.ru\r\n"
                + "DTSTAMP:" + now + "\r\n"
                + "DTSTART:" + dtStart + "\r\n"
                + "DTEND:" + dtEnd + "\r\n"
                + "SUMMARY:" + e.getTitle() + " (" + e.getSport().getName() + ")\r\n"
                + "LOCATION:" + e.getCity() + ", " + e.getLocationAddress() + "\r\n"
                + "DESCRIPTION:" + cleanDesc + "\r\n"
                + "END:VEVENT\r\n"
                + "END:VCALENDAR\r\n";
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void runScheduledMaintenanceAndReminders() {
        List<EventSeries> activeSeries = seriesRepository.findByActiveTrue();
        for (EventSeries s : activeSeries) {
            generateOccurrencesForSeries(s, recurringWeeksAhead);
        }
        dispatchUpcomingReminders();
    }

    @Transactional
    public int dispatchUpcomingReminders() {
        int sentCount = 0;
        Instant now = Instant.now();
        Instant windowEnd = now.plus(firstReminderHours + 1L, ChronoUnit.HOURS);

        List<Event> upcoming = eventRepository.findByStatusAndStartsAtBetween(EventStatus.PUBLISHED, now, windowEnd);
        for (Event ev : upcoming) {
            long minutesUntil = Duration.between(now, ev.getStartsAt()).toMinutes();
            String reminderType = null;
            String label = null;
            if (minutesUntil <= (long) secondReminderHours * 60 && minutesUntil > 10) {
                reminderType = "BEFORE_2H";
                label = "менее чем через 2 часа";
            } else if (minutesUntil <= (long) firstReminderHours * 60 && minutesUntil > (long) secondReminderHours * 60) {
                reminderType = "BEFORE_24H";
                label = "завтра / менее чем через 24 часа";
            }
            if (reminderType == null) continue;

            List<EventParticipation> confirmed = participationRepository.findByEventIdAndStatusOrderByCreatedAtAsc(
                    ev.getId(), ParticipationStatus.CONFIRMED);
            for (EventParticipation part : confirmed) {
                User u = part.getUser();
                boolean alreadySent = reminderLogRepository.existsByEventIdAndUserIdAndReminderTypeAndEventStartsAt(
                        ev.getId(), u.getId(), reminderType, ev.getStartsAt());
                if (!alreadySent) {
                    EventReminderLog logRecord = new EventReminderLog();
                    logRecord.setEventId(ev.getId());
                    logRecord.setUserId(u.getId());
                    logRecord.setReminderType(reminderType);
                    logRecord.setEventStartsAt(ev.getStartsAt());
                    reminderLogRepository.save(logRecord);

                    notificationService.notifyUser(
                            u,
                            NotificationType.EVENT_REMINDER,
                            "Напоминание о тренировке «" + ev.getTitle() + "»",
                            "Встреча по направлению «" + ev.getSport().getName() + "» состоится " + label
                                    + ". Место: " + ev.getCity() + ", " + ev.getLocationAddress() + ".",
                            "/events/" + ev.getId()
                    );
                    sentCount++;
                }
            }
        }
        return sentCount;
    }

    public boolean canManageEvent(Event event, UserPrincipal viewer) {
        if (viewer == null) return false;
        if (event.getOrganizer().getId().equals(viewer.id())) return true;
        if (event.getOrganization() != null && canUserManageOrg(event.getOrganization(), viewer.id())) {
            return true;
        }
        return false;
    }

    private boolean canUserManageOrg(Organization org, UUID userId) {
        if (org == null || userId == null) return false;
        if (org.getOwner().getId().equals(userId)) return true;
        return subscriptionRepository.findByOrganizationIdAndUserId(org.getId(), userId)
                .map(s -> "ADMIN".equalsIgnoreCase(s.getMemberRole()))
                .orElse(false);
    }

    public EventCardDto toCardDto(Event e, UserPrincipal viewer) {
        long confirmedCount = participationRepository.countByEventIdAndStatus(e.getId(), ParticipationStatus.CONFIRMED);
        long pendingCount = participationRepository.countByEventIdAndStatus(e.getId(), ParticipationStatus.PENDING);
        long waitlistCount = participationRepository.countByEventIdAndStatus(e.getId(), ParticipationStatus.WAITLISTED);

        ParticipationStatus viewerStatus = null;
        if (viewer != null) {
            viewerStatus = participationRepository.findByEventIdAndUserId(e.getId(), viewer.id())
                    .map(EventParticipation::getStatus)
                    .orElse(null);
        }

        String orgAvatar = e.getOrganizer().getAvatarAttachmentId() != null
                ? "/api/v1/attachments/" + e.getOrganizer().getAvatarAttachmentId() + "/content"
                : null;

        UUID coverId = e.getCoverAttachmentId() != null
                ? e.getCoverAttachmentId()
                : (e.getSeries() != null ? e.getSeries().getCoverAttachmentId() : null);

        String coverUrl = coverId != null
                ? "/api/v1/attachments/" + coverId + "/content"
                : null;

        return new EventCardDto(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                sportService.toDto(e.getSport()),
                e.getOrganizer().getId(),
                e.getOrganizer().getDisplayName(),
                orgAvatar,
                e.getOrganization() != null ? e.getOrganization().getId() : null,
                e.getOrganization() != null ? e.getOrganization().getName() : null,
                e.getOrganization() != null && e.getOrganization().getStatus() == OrganizationStatus.APPROVED,
                e.getSeries() != null ? e.getSeries().getId() : null,
                e.getOccurrenceDate(),
                e.isRecurringOccurrence(),
                e.isModifiedOccurrence(),
                e.getCity(),
                e.getLocationAddress(),
                e.getLatitude(),
                e.getLongitude(),
                e.getStartsAt(),
                e.getEndsAt(),
                e.getJoinMode(),
                e.getSkillLevel(),
                e.getActivityFormat(),
                e.getParticipationConditions(),
                e.getWhatToBring(),
                e.getMaxParticipants(),
                confirmedCount,
                pendingCount,
                waitlistCount,
                e.getStatus(),
                e.getModerationReason(),
                e.getCancellationReason(),
                viewerStatus,
                coverUrl,
                canManageEvent(e, viewer),
                e.getCreatedAt()
        );
    }

    private ParticipantDto toParticipantDto(EventParticipation p) {
        String avatar = p.getUser().getAvatarAttachmentId() != null
                ? "/api/v1/attachments/" + p.getUser().getAvatarAttachmentId() + "/content"
                : null;
        return new ParticipantDto(
                p.getId(),
                p.getUser().getId(),
                p.getUser().getDisplayName(),
                avatar,
                p.getUser().getCity(),
                p.getStatus(),
                p.getRequestComment(),
                p.getOrganizerComment(),
                p.getCreatedAt()
        );
    }

    private void notifyParticipantsAboutCancellation(Event event, String reason) {
        List<EventParticipation> parts = participationRepository.findByEventIdOrderByCreatedAtAsc(event.getId());
        for (EventParticipation p : parts) {
            if (p.getStatus() == ParticipationStatus.CONFIRMED || p.getStatus() == ParticipationStatus.PENDING || p.getStatus() == ParticipationStatus.WAITLISTED) {
                notificationService.notifyUser(
                        p.getUser(),
                        NotificationType.EVENT_CANCELLED,
                        "Встреча «" + event.getTitle() + "» отменена",
                        "Причина отмены: " + reason,
                        "/events/" + event.getId()
                );
            }
        }
    }

    // =========================================================================
    // УМНЫЙ НЕЧЁТКИЙ ПОИСК (С УЧЁТОМ ДЕФИСОВ, «Ё/Е», ТОКЕНОВ И ОПЕЧАТОК)
    // =========================================================================

    public static String normalizeSearchText(String input) {
        if (input == null) return "";
        return input.toLowerCase(Locale.ROOT)
                .replace('ё', 'е')
                .replace('-', ' ')
                .replaceAll("[^a-zа-я0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public static boolean fuzzyCityMatches(String filterCity, String entityCity) {
        if (filterCity == null || filterCity.isBlank()) return true;
        if (entityCity == null || entityCity.isBlank()) return false;
        String normFilter = normalizeSearchText(filterCity);
        String normEntity = normalizeSearchText(entityCity);
        if (normEntity.contains(normFilter) || normFilter.contains(normEntity)) return true;
        return fuzzyTextMatches(filterCity, entityCity);
    }

    public static boolean fuzzyTextMatches(String rawQuery, String... targets) {
        String normQuery = normalizeSearchText(rawQuery);
        if (normQuery.isEmpty()) return true;

        StringBuilder combined = new StringBuilder();
        for (String t : targets) {
            if (t != null && !t.isBlank()) {
                combined.append(normalizeSearchText(t)).append(" ");
            }
        }
        String haystack = combined.toString().trim();
        if (haystack.isEmpty()) return false;
        if (haystack.contains(normQuery)) return true;

        String[] queryTokens = normQuery.split(" ");
        String[] hayWords = haystack.split(" ");

        for (String qToken : queryTokens) {
            if (qToken.isEmpty()) continue;
            boolean tokenMatched = haystack.contains(qToken);
            if (!tokenMatched && qToken.length() >= 4) {
                String stem = qToken.substring(0, Math.min(qToken.length() - 1, 5));
                int maxDist = qToken.length() >= 6 ? 2 : 1;
                for (String hw : hayWords) {
                    if (hw.length() >= 3 && (hw.startsWith(stem) || levenshtein(qToken, hw) <= maxDist)) {
                        tokenMatched = true;
                        break;
                    }
                }
            }
            if (!tokenMatched) {
                return false;
            }
        }
        return true;
    }

    private static int levenshtein(String a, String b) {
        if (Math.abs(a.length() - b.length()) > 2) return 3;
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[a.length()][b.length()];
    }
}
