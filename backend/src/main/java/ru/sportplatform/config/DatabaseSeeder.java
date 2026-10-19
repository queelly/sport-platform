package ru.sportplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.*;
import ru.sportplatform.domain.enums.Enums.*;
import ru.sportplatform.repository.*;
import ru.sportplatform.service.EventService;
import ru.sportplatform.service.SportService;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final SportRepository sportRepository;
    private final SportService sportService;
    private final UserSportInterestRepository sportInterestRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationApplicationHistoryRepository orgHistoryRepository;
    private final EventRepository eventRepository;
    private final EventSeriesRepository seriesRepository;
    private final EventParticipationRepository participationRepository;
    private final DiscussionMessageRepository discussionMessageRepository;
    private final FriendshipRepository friendshipRepository;
    private final SupportTicketRepository ticketRepository;
    private final SupportTicketMessageRepository ticketMessageRepository;
    private final SupportConversationRepository conversationRepository;
    private final SupportChatMessageRepository chatMessageRepository;
    private final NotificationRepository notificationRepository;
    private final EventService eventService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@sportplatform.ru}")
    private String adminEmail;

    @Value("${app.admin.password:AdminPassword123!}")
    private String adminPassword;

    @Value("${app.admin.name:Главный Администратор}")
    private String adminName;

    @Value("${app.seed.demo-data:true}")
    private boolean seedDemoData;

    public DatabaseSeeder(
            UserRepository userRepository,
            SportRepository sportRepository,
            SportService sportService,
            UserSportInterestRepository sportInterestRepository,
            OrganizationRepository organizationRepository,
            OrganizationApplicationHistoryRepository orgHistoryRepository,
            EventRepository eventRepository,
            EventSeriesRepository seriesRepository,
            EventParticipationRepository participationRepository,
            DiscussionMessageRepository discussionMessageRepository,
            FriendshipRepository friendshipRepository,
            SupportTicketRepository ticketRepository,
            SupportTicketMessageRepository ticketMessageRepository,
            SupportConversationRepository conversationRepository,
            SupportChatMessageRepository chatMessageRepository,
            NotificationRepository notificationRepository,
            EventService eventService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.sportRepository = sportRepository;
        this.sportService = sportService;
        this.sportInterestRepository = sportInterestRepository;
        this.organizationRepository = organizationRepository;
        this.orgHistoryRepository = orgHistoryRepository;
        this.eventRepository = eventRepository;
        this.seriesRepository = seriesRepository;
        this.participationRepository = participationRepository;
        this.discussionMessageRepository = discussionMessageRepository;
        this.friendshipRepository = friendshipRepository;
        this.ticketRepository = ticketRepository;
        this.ticketMessageRepository = ticketMessageRepository;
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.notificationRepository = notificationRepository;
        this.eventService = eventService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        User admin = ensureInitialAdmin();
        List<Sport> baseSports = ensureBaseSports(admin);

        if (seedDemoData && eventRepository.count() == 0) {
            log.info("Загрузка начальных тестовых данных для проверки сценариев (APP_SEED_DEMO_DATA=true)...");
            seedFullDemoEnvironment(admin, baseSports);
            log.info("Начальные данные успешно загружены.");
        }
    }

    private User ensureInitialAdmin() {
        return userRepository.findByEmailIgnoreCase(adminEmail)
                .orElseGet(() -> {
                    User admin = new User();
                    admin.setEmail(adminEmail.toLowerCase());
                    admin.setDisplayName(adminName);
                    admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                    admin.setGlobalRole(GlobalRole.ADMIN);
                    admin.setCity("Москва");
                    admin.setBio("Администратор и модератор Спортивной Платформы «Точка Сбора»");
                    admin.setShowInPartnerSearch(false);
                    return userRepository.save(admin);
                });
    }

    private List<Sport> ensureBaseSports(User admin) {
        Sport football = ensureSport("Футбол", "Командные игры", "Мини-футбол 5x5, 8x8 и большой футбол на открытых и крытых полях", "Dribbble", admin);
        Sport basketball = ensureSport("Баскетбол", "Командные игры", "Стритбол 3x3 и классический баскетбол 5x5 в зале и на площадках", "CircleDot", admin);
        Sport running = ensureSport("Бег", "Циклические виды", "Шоссейный бег, парковые пробежки, трейлраннинг и подготовка к забегам", "Footprints", admin);
        Sport tennis = ensureSport("Теннис", "Ракеточные виды", "Большой теннис, спарринги и парные матчи на грунте и харде", "Sparkles", admin);
        Sport swimming = ensureSport("Плавание", "Водные виды", "Тренировки в бассейне 25/50м и заплывы на открытой воде", "Waves", admin);
        Sport volleyball = ensureSport("Волейбол", "Командные игры", "Классический и пляжный волейбол для любого уровня", "Flame", admin);
        return List.of(football, basketball, running, tennis, swimming, volleyball);
    }

    private Sport ensureSport(String name, String category, String description, String icon, User creator) {
        String norm = SportService.normalizeSportName(name);
        return sportRepository.findByNormalizedName(norm).orElseGet(() -> {
            Sport s = new Sport();
            s.setName(name);
            s.setNormalizedName(norm);
            s.setCategory(category);
            s.setDescription(description);
            s.setIconName(icon);
            s.setCreatedByUserId(creator.getId());
            return sportRepository.save(s);
        });
    }

    private void seedFullDemoEnvironment(User admin, List<Sport> sports) {
        Sport football = sports.get(0);
        Sport basketball = sports.get(1);
        Sport running = sports.get(2);
        Sport tennis = sports.get(3);
        Sport swimming = sports.get(4);
        Sport volleyball = sports.get(5);

        String testPwdHash = passwordEncoder.encode("SportPass123!");

        // 1. Обычные пользователи
        User alexey = createUser("alexey@sportplatform.ru", "Алексей Громов", "Москва", "Хамовники",
                "Бегаю полумарафоны, по пятницам собираю баскетбол 5x5 в Лужниках. Всегда рад новым спортивным знакомым!",
                "Вечерние игровые тренировки и субботние длительные пробежки", "Вт, Чт после 19:00, Сб утро", testPwdHash);
        addSportInterest(alexey, basketball, SkillLevel.ADVANCED, true, false, "Играю разыгрывающим 6 лет");
        addSportInterest(alexey, running, SkillLevel.AMATEUR, false, false, "Темп 5:00–5:20 мин/км");

        User maria = createUser("maria@sportplatform.ru", "Мария Соколова", "Москва", "Пресненский",
                "Люблю большой теннис, плавание и утренние пробежки в парке Горького. Ищу партнёров для регулярных спаррингов по выходным.",
                "Парные спарринги, клубные пробежки", "Сб, Вс с 09:00 до 14:00", testPwdHash);
        addSportInterest(maria, tennis, SkillLevel.AMATEUR, true, false, "Уровень NTRP 3.5");
        addSportInterest(maria, running, SkillLevel.BEGINNER, false, false, "Комфортный разговорный темп");
        addSportInterest(maria, swimming, SkillLevel.AMATEUR, false, true, "Тренирую кроль в 50м бассейне");

        User dmitry = createUser("dmitry@sportplatform.ru", "Дмитрий Волков", "Москва", "Сокольники",
                "Капитан любительской футбольной команды и участник волейбольных сборов. Часто ищу +2-3 игроков на вечерний манеж.",
                "Командные матчи 5x5 и 6x6", "Пн, Ср, Пт 20:00", testPwdHash);
        addSportInterest(dmitry, football, SkillLevel.COMPETITIVE, true, false, "Любительская лига 8x8");
        addSportInterest(dmitry, volleyball, SkillLevel.AMATEUR, false, false, "Доигровщик");

        // 2. Представители организаций и 3 состояния организаций (Одобрена, На проверке, Отклонена для проверки переподачи)
        User clubOwnerApproved = createUser("club@sportplatform.ru", "Игорь Ветров (Беговой клуб «Темп»)", "Москва", "Лужники",
                "Основатель и старший координатор городского бегового сообщества «Темп Москва».",
                "Групповые беговые тренировки и ОФП", "Ежедневно", testPwdHash);

        Organization approvedOrg = new Organization();
        approvedOrg.setOwner(clubOwnerApproved);
        approvedOrg.setName("Городской беговой и мультиспортивный клуб «Темп»");
        approvedOrg.setOrgType(OrganizationType.SPORTS_CLUB);
        approvedOrg.setCity("Москва");
        approvedOrg.setDescription("Крупнейшее открытое беговое и триатлон-сообщество в Лужниках. Проводим еженедельные бесплатные субботние пробежки, интервальные тренировки на дорожке и открытые игровые сборы.");
        approvedOrg.setRepresentativeName("Игорь Ветров");
        approvedOrg.setModerationContact("+7 (999) 111-22-33 (приватный контакт для администрации)");
        approvedOrg.setPublicContacts("Telegram/VK: @temp_run_moscow, тел. дежурного координатора: +7 (495) 000-10-20");
        approvedOrg.setWebsiteUrl("https://temp-sport-club.example.ru");
        approvedOrg.setSocialUrl("https://vk.com/temp_run_club");
        approvedOrg.setVerificationLink("https://vk.com/temp_run_club");
        approvedOrg.setStatus(OrganizationStatus.APPROVED);
        approvedOrg.setSubmissionVersion(1);
        approvedOrg.setReviewedByAdminId(admin.getId());
        approvedOrg.setReviewedAt(Instant.now().minus(3, ChronoUnit.DAYS));
        approvedOrg.setSports(Set.of(running, swimming, football));
        approvedOrg = organizationRepository.save(approvedOrg);
        saveHistory(approvedOrg, 1, OrganizationStatus.APPROVED, "Организация проверена и одобрена администратором", admin.getId());

        User clubOwnerPending = createUser("arena@sportplatform.ru", "Елена Крылова (Клуб «Волейбол-Сити»)", "Санкт-Петербург", "Петроградский",
                "Координатор любительской школы и клуба волейбола «Волейбол-Сити».",
                "Игровые сборы и турниры выходного дня", "Вт, Чт, Вс", testPwdHash);

        Organization pendingOrg = new Organization();
        pendingOrg.setOwner(clubOwnerPending);
        pendingOrg.setName("Сообщество любительского волейбола «Волейбол-Сити»");
        pendingOrg.setOrgType(OrganizationType.COMMUNITY);
        pendingOrg.setCity("Санкт-Петербург");
        pendingOrg.setDescription("Регулярные сборы по классическому и пляжному волейболу для игроков уровней Начинающий+ и Любитель. Делим на равные составы на месте.");
        pendingOrg.setRepresentativeName("Елена Крылова");
        pendingOrg.setModerationContact("+7 (921) 555-44-33, elena@volleycity.example.ru");
        pendingOrg.setPublicContacts("https://vk.com/volleycity_spb");
        pendingOrg.setVerificationLink("https://vk.com/volleycity_spb");
        pendingOrg.setStatus(OrganizationStatus.PENDING_REVIEW);
        pendingOrg.setSubmissionVersion(1);
        pendingOrg.setSports(Set.of(volleyball));
        pendingOrg = organizationRepository.save(pendingOrg);
        saveHistory(pendingOrg, 1, OrganizationStatus.PENDING_REVIEW, "Ожидает первичной проверки администратором", null);

        User clubOwnerRejected = createUser("start@sportplatform.ru", "Антон Белов (Секция «Корт-Мастер»)", "Москва", "Сокол",
                "Представитель теннисного клуба «Корт-Мастер».",
                "Спарринги и групповые тренировки", "Сб, Вс", testPwdHash);

        Organization rejectedOrg = new Organization();
        rejectedOrg.setOwner(clubOwnerRejected);
        rejectedOrg.setName("Теннисное объединение «Корт-Мастер»");
        rejectedOrg.setOrgType(OrganizationType.SECTION);
        rejectedOrg.setCity("Москва");
        rejectedOrg.setDescription("Совместная аренда кортов и проведение любительских матчей по выходным.");
        rejectedOrg.setRepresentativeName("Антон Белов");
        rejectedOrg.setModerationContact("+7 (916) 777-88-99");
        rejectedOrg.setPublicContacts("Уточняется");
        rejectedOrg.setStatus(OrganizationStatus.REJECTED);
        rejectedOrg.setRejectionReason("Пожалуйста, укажите ссылку на публичную страницу или расписание кортов для подтверждения подлинности клуба, а также дополните публичные контакты для участников.");
        rejectedOrg.setSubmissionVersion(1);
        rejectedOrg.setReviewedByAdminId(admin.getId());
        rejectedOrg.setReviewedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        rejectedOrg.setSports(Set.of(tennis));
        rejectedOrg = organizationRepository.save(rejectedOrg);
        saveHistory(rejectedOrg, 1, OrganizationStatus.REJECTED, rejectedOrg.getRejectionReason(), admin.getId());

        // 3. Разовые и регулярные мероприятия
        Instant now = Instant.now();

        // Событие 1: Разовое личное мероприятие со свободной записью (OPEN)
        Event evBasketball = new Event();
        evBasketball.setTitle("Пятничный баскетбол 5x5 в Лужниках (Свободный вход)");
        evBasketball.setDescription("Дружеская вечерняя игра на открытом корте с отличным покрытием. Делимся на 3 команды по 5 человек, играем до 16 очков или 10 минут. Мячи Molten 7-ка есть.");
        evBasketball.setSport(basketball);
        evBasketball.setOrganizer(alexey);
        evBasketball.setCity("Москва");
        evBasketball.setLocationAddress("Лужнецкая набережная, 24, площадка «Под мостом»");
        evBasketball.setLatitude(55.7158);
        evBasketball.setLongitude(37.5537);
        evBasketball.setStartsAt(now.plus(18, ChronoUnit.HOURS));
        evBasketball.setEndsAt(now.plus(20, ChronoUnit.HOURS));
        evBasketball.setJoinMode(JoinMode.OPEN);
        evBasketball.setSkillLevel(SkillLevel.AMATEUR);
        evBasketball.setActivityFormat("Игровая встреча 5x5");
        evBasketball.setParticipationConditions("Бесплатно. Уважительная игра без грубых фолов.");
        evBasketball.setWhatToBring("Светлая и тёмная футболки, вода, кроссовки для улицы");
        evBasketball.setMaxParticipants(15);
        evBasketball.setStatus(EventStatus.PUBLISHED);
        evBasketball = eventRepository.save(evBasketball);

        // Событие 2: Мероприятие с записью ПО ЗАЯВКЕ (APPROVAL_REQUIRED)
        Event evTennis = new Event();
        evTennis.setTitle("Парный теннисный спарринг NTRP 3.0–4.0 на грунте");
        evTennis.setDescription("Собираем 4 игроков близкого уровня на 2 часа парной игры со сменой партнёров. Запись по заявке, чтобы подобрать ровный состав.");
        evTennis.setSport(tennis);
        evTennis.setOrganizer(maria);
        evTennis.setCity("Москва");
        evTennis.setLocationAddress("Пресненский Вал, 27, Теннисный центр «Пресня», корт №3");
        evTennis.setLatitude(55.7684);
        evTennis.setLongitude(37.5641);
        evTennis.setStartsAt(now.plus(2, ChronoUnit.DAYS));
        evTennis.setEndsAt(now.plus(2, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS));
        evTennis.setJoinMode(JoinMode.APPROVAL_REQUIRED);
        evTennis.setSkillLevel(SkillLevel.AMATEUR);
        evTennis.setActivityFormat("Парный спарринг 2x2");
        evTennis.setParticipationConditions("Аренда корта делится поровну между 4 участниками на месте. В заявке кратко укажите ваш опыт игры.");
        evTennis.setWhatToBring("Теннисная ракетка, обувь для грунта (clay), банка новых мячей приветствуется");
        evTennis.setMaxParticipants(4);
        evTennis.setStatus(EventStatus.PUBLISHED);
        evTennis = eventRepository.save(evTennis);

        // Событие 3: Регулярная серия от одобренной организации «Темп»
        EventSeries runSeries = new EventSeries();
        runSeries.setTitle("Субботняя набережная 10 км с клубом «Темп» (Регулярная серия)");
        runSeries.setDescription("Еженедельная клубная пробежка по набережным Москвы-реки в трёх темповых группах (5:00, 5:40 и 6:15 мин/км) с разминкой и заминкой от координаторов клуба.");
        runSeries.setSport(running);
        runSeries.setOrganizer(clubOwnerApproved);
        runSeries.setOrganization(approvedOrg);
        runSeries.setCity("Москва");
        runSeries.setLocationAddress("Парк Горького, Главный вход (сбор у колоннады)");
        runSeries.setLatitude(55.7312);
        runSeries.setLongitude(37.6032);
        runSeries.setDayOfWeek(6); // Saturday
        runSeries.setStartTimeLocal("10:00");
        runSeries.setDurationMinutes(90);
        runSeries.setJoinMode(JoinMode.OPEN);
        runSeries.setSkillLevel(SkillLevel.ANY);
        runSeries.setParticipationConditions("Участие полностью свободное. Есть гардероб для вещей.");
        runSeries.setWhatToBring("Беговая экипировка по погоде");
        runSeries.setMaxParticipants(40);
        runSeries.setStartDate(LocalDate.now());
        runSeries.setActive(true);
        runSeries = seriesRepository.save(runSeries);
        List<Event> runOccurrences = eventService.generateOccurrencesForSeries(runSeries, 4);

        // Событие 4: Вечерний футбол 5x5 с небольшим лимитом для проверки очереди/записи
        Event evFootball = new Event();
        evFootball.setTitle("Вечерний мини-футбол 5x5 в манеже Сокольники");
        evFootball.setDescription("Интенсивный матч 90 минут в крытом манеже с искусственной травой последнего поколения. Есть раздевалки и душевые.");
        evFootball.setSport(football);
        evFootball.setOrganizer(dmitry);
        evFootball.setCity("Москва");
        evFootball.setLocationAddress("Сокольнический Вал, 1Б, Манеж «Спартак», поле №2");
        evFootball.setLatitude(55.7923);
        evFootball.setLongitude(37.6712);
        evFootball.setStartsAt(now.plus(3, ChronoUnit.DAYS));
        evFootball.setEndsAt(now.plus(3, ChronoUnit.DAYS).plus(90, ChronoUnit.MINUTES));
        evFootball.setJoinMode(JoinMode.APPROVAL_REQUIRED);
        evFootball.setSkillLevel(SkillLevel.ADVANCED);
        evFootball.setActivityFormat("Матч 5x5");
        evFootball.setParticipationConditions("Оргвзнос за аренду манежа — 600 руб. с игрока на месте.");
        evFootball.setWhatToBring("Сороконожки (TF) или бутсы без железных шипов, гетры");
        evFootball.setMaxParticipants(10);
        evFootball.setStatus(EventStatus.PUBLISHED);
        evFootball = eventRepository.save(evFootball);

        // 4. Записи и заявки на мероприятия (CONFIRMED, PENDING, REJECTED)
        createParticipation(evBasketball, maria, ParticipationStatus.CONFIRMED, "Буду вовремя!", null);
        createParticipation(evBasketball, dmitry, ParticipationStatus.CONFIRMED, "Беру с собой насос и второй мяч", null);

        createParticipation(evTennis, alexey, ParticipationStatus.PENDING, "Играю 2 года, стабильно держу заднюю линию, хочу присоединиться в эту субботу!", null);
        createParticipation(evTennis, dmitry, ParticipationStatus.CONFIRMED, "Уровень 3.5, ракетка Wilson, буду за 15 минут до начала", "Отлично, ждём на корте №3!");
        createParticipation(evTennis, clubOwnerRejected, ParticipationStatus.REJECTED, "Только начинаю держать ракетку, первый раз на корте", "В этот раз собираем спарринг уровня 3.0+, но будем рады видеть на открытой тренировке для начинающих!");

        if (!runOccurrences.isEmpty()) {
            Event firstRun = runOccurrences.getFirst();
            createParticipation(firstRun, alexey, ParticipationStatus.CONFIRMED, null, null);
            createParticipation(firstRun, maria, ParticipationStatus.CONFIRMED, null, null);
        }

        // 5. Сообщения в обсуждениях мероприятий
        DiscussionMessage m1 = new DiscussionMessage();
        m1.setEvent(evBasketball);
        m1.setAuthor(maria);
        m1.setContent("Подскажите, пожалуйста, есть ли рядом с площадкой кулер или лучше взять побольше воды с собой?");
        m1.setExternalLinkUrl("https://luzhniki.ru");
        discussionMessageRepository.save(m1);

        DiscussionMessage m2 = new DiscussionMessage();
        m2.setEvent(evBasketball);
        m2.setAuthor(alexey);
        m2.setContent("Мария, в 100 метрах у павильона проката есть вендинговый автомат и кафе, но бутылку воды 0.7л лучше захватить сразу на корт!");
        m2.setReplyToMessageId(m1.getId());
        discussionMessageRepository.save(m2);

        // 6. Спортивные знакомые (ACCEPTED и PENDING)
        Friendship fAccepted = new Friendship();
        fAccepted.setRequester(alexey);
        fAccepted.setAddressee(maria);
        fAccepted.setStatus(FriendshipStatus.ACCEPTED);
        fAccepted.setMessage("Привет! Часто бегаем в Лужниках и Парке Горького, давай держаться на связи.");
        friendshipRepository.save(fAccepted);

        Friendship fPending = new Friendship();
        fPending.setRequester(dmitry);
        fPending.setAddressee(alexey);
        fPending.setStatus(FriendshipStatus.PENDING);
        fPending.setMessage("Алексей, отлично сыграли в баскетбол! Добавляйся в спортивные знакомые.");
        friendshipRepository.save(fPending);

        // 7. Примеры тикетов (OPEN, IN_PROGRESS, CLOSED)
        SupportTicket tOpen = new SupportTicket();
        tOpen.setTicketNumber("TCK-10421");
        tOpen.setAuthor(maria);
        tOpen.setCategory(TicketCategory.EVENT_COMPLAINT);
        tOpen.setSubject("Вопрос по корректности описания времени сбора на открытой площадке");
        tOpen.setDescription("Просьба уточнить у организатора точный ориентир входа со стороны набережной, так как центральная аллея сейчас частично перекрыта.");
        tOpen.setTargetType("EVENT");
        tOpen.setTargetId(evBasketball.getId());
        tOpen.setStatus(TicketStatus.OPEN);
        tOpen = ticketRepository.save(tOpen);
        saveTicketMessage(tOpen, maria, false, tOpen.getDescription());

        SupportTicket tInProgress = new SupportTicket();
        tInProgress.setTicketNumber("TCK-10389");
        tInProgress.setAuthor(clubOwnerPending);
        tInProgress.setCategory(TicketCategory.ORGANIZATION_COMPLAINT);
        tInProgress.setSubject("Уточнение по срокам рассмотрения заявки клуба «Волейбол-Сити»");
        tInProgress.setDescription("Добрый день! Мы подали заявку на верификацию волейбольного сообщества. Подскажите, нужны ли от нас дополнительные ссылки на фото с тренировок?");
        tInProgress.setTargetType("ORGANIZATION");
        tInProgress.setTargetId(pendingOrg.getId());
        tInProgress.setStatus(TicketStatus.IN_PROGRESS);
        tInProgress.setAssignedAdminId(admin.getId());
        tInProgress = ticketRepository.save(tInProgress);
        saveTicketMessage(tInProgress, clubOwnerPending, false, tInProgress.getDescription());
        saveTicketMessage(tInProgress, admin, true, "Здравствуйте, Елена! Заявка уже взята в работу модератором, публичной ссылки на группу VK достаточно. Сегодня примем решение.");

        SupportTicket tClosed = new SupportTicket();
        tClosed.setTicketNumber("TCK-10105");
        tClosed.setAuthor(alexey);
        tClosed.setCategory(TicketCategory.NOTIFICATION_ISSUE);
        tClosed.setSubject("Настройка напоминаний через VK-бота");
        tClosed.setDescription("Хотел уточнить, за сколько часов приходят автоматические напоминания о предстоящих тренировках?");
        tClosed.setStatus(TicketStatus.CLOSED);
        tClosed.setAssignedAdminId(admin.getId());
        tClosed.setResolutionSummary("Разъяснён график отправки напоминаний (за 24 часа и за 2 часа до начала встречи).");
        tClosed = ticketRepository.save(tClosed);
        saveTicketMessage(tClosed, alexey, false, tClosed.getDescription());
        saveTicketMessage(tClosed, admin, true, "Алексей, система отправляет напоминания автоматически за 24 часа и за 2 часа до старта каждой подтверждённой встречи.");

        // 8. Тестовая переписка в отдельном чате технической поддержки
        SupportConversation chatConv = new SupportConversation();
        chatConv.setUser(alexey);
        chatConv.setStatus(SupportConversationStatus.ANSWERED);
        chatConv.setUnreadByUser(true);
        chatConv.setUnreadByAdmin(false);
        chatConv.setLastMessagePreview("Поддержка: Да, вы можете экспортировать любую встречу в формат .ics прямо из карточки события!");
        chatConv = conversationRepository.save(chatConv);

        SupportChatMessage cm1 = new SupportChatMessage();
        cm1.setConversation(chatConv);
        cm1.setSender(alexey);
        cm1.setFromAdmin(false);
        cm1.setContent("Привет! Подскажите быстрый вопрос: можно ли добавить тренировку с вашей платформы себе в стандартный календарь телефона?");
        chatMessageRepository.save(cm1);

        SupportChatMessage cm2 = new SupportChatMessage();
        cm2.setConversation(chatConv);
        cm2.setSender(admin);
        cm2.setFromAdmin(true);
        cm2.setContent("Здравствуйте, Алексей! Да, конечно: в карточке любого мероприятия есть кнопка «В календарь (.ics)», которая скачивает файл встречи для Apple/Google/Outlook календаря.");
        chatMessageRepository.save(cm2);

        // 9. Начальные уведомления
        Notification n1 = new Notification();
        n1.setUser(alexey);
        n1.setType(NotificationType.FRIEND_REQUEST_RECEIVED);
        n1.setTitle("Новый запрос в спортивные знакомые");
        n1.setMessage("Дмитрий Волков хочет добавить вас в список спортивных знакомых.");
        n1.setLinkUrl("/friends");
        notificationRepository.save(n1);

        Notification n2 = new Notification();
        n2.setUser(maria);
        n2.setType(NotificationType.PARTICIPATION_REQUESTED);
        n2.setTitle("Новая заявка на «Парный теннисный спарринг»");
        n2.setMessage("Алексей Громов подал заявку на участие в вашем мероприятии.");
        n2.setLinkUrl("/events/" + evTennis.getId());
        notificationRepository.save(n2);
    }

    private User createUser(String email, String name, String city, String district, String bio, String formats, String schedule, String pwdHash) {
        User u = new User();
        u.setEmail(email);
        u.setDisplayName(name);
        u.setCity(city);
        u.setDistrict(district);
        u.setBio(bio);
        u.setPreferredFormats(formats);
        u.setPreferredSchedule(schedule);
        u.setPasswordHash(pwdHash);
        u.setGlobalRole(GlobalRole.USER);
        return userRepository.save(u);
    }

    private void addSportInterest(User user, Sport sport, SkillLevel level, boolean primary, boolean tryNew, String note) {
        UserSportInterest i = new UserSportInterest();
        i.setUser(user);
        i.setSport(sport);
        i.setSkillLevel(level);
        i.setPrimarySport(primary);
        i.setWantToTryNew(tryNew);
        i.setNote(note);
        sportInterestRepository.save(i);
    }

    private void createParticipation(Event event, User user, ParticipationStatus status, String reqComment, String orgComment) {
        EventParticipation p = new EventParticipation();
        p.setEvent(event);
        p.setUser(user);
        p.setStatus(status);
        p.setRequestComment(reqComment);
        p.setOrganizerComment(orgComment);
        participationRepository.save(p);
    }

    private void saveHistory(Organization org, int ver, OrganizationStatus st, String reason, java.util.UUID adminId) {
        OrganizationApplicationHistory h = new OrganizationApplicationHistory();
        h.setOrganization(org);
        h.setVersionNumber(ver);
        h.setSubmittedSnapshot("Название: " + org.getName() + " | Город: " + org.getCity() + " | Представитель: " + org.getRepresentativeName());
        h.setStatus(st);
        h.setDecisionReason(reason);
        h.setDecidedByAdminId(adminId);
        if (adminId != null) {
            h.setDecidedAt(Instant.now());
        }
        orgHistoryRepository.save(h);
    }

    private void saveTicketMessage(SupportTicket ticket, User author, boolean isAdmin, String content) {
        SupportTicketMessage m = new SupportTicketMessage();
        m.setTicket(ticket);
        m.setAuthor(author);
        m.setAdminReply(isAdmin);
        m.setContent(content);
        ticketMessageRepository.save(m);
    }
}
