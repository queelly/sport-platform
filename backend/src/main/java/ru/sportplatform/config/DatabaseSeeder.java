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
import java.util.UUID;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final SportRepository sportRepository;
    private final SportService sportService;
    private final UserSportInterestRepository sportInterestRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationApplicationHistoryRepository orgHistoryRepository;
    private final OrganizationSubscriptionRepository orgSubscriptionRepository;
    private final EventRepository eventRepository;
    private final EventSeriesRepository seriesRepository;
    private final EventParticipationRepository participationRepository;
    private final DiscussionMessageRepository discussionMessageRepository;
    private final FriendshipRepository friendshipRepository;
    private final DirectMessageRepository directMessageRepository;
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
            OrganizationSubscriptionRepository orgSubscriptionRepository,
            EventRepository eventRepository,
            EventSeriesRepository seriesRepository,
            EventParticipationRepository participationRepository,
            DiscussionMessageRepository discussionMessageRepository,
            FriendshipRepository friendshipRepository,
            DirectMessageRepository directMessageRepository,
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
        this.orgSubscriptionRepository = orgSubscriptionRepository;
        this.eventRepository = eventRepository;
        this.seriesRepository = seriesRepository;
        this.participationRepository = participationRepository;
        this.discussionMessageRepository = discussionMessageRepository;
        this.friendshipRepository = friendshipRepository;
        this.directMessageRepository = directMessageRepository;
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
            log.info("Загрузка демонстрационных данных платформы «Точка Сбора» (APP_SEED_DEMO_DATA=true)...");
            seedFullDemoEnvironment(admin, baseSports);
            log.info("Демонстрационные данные успешно загружены.");
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
        Sport cycling = ensureSport("Велоспорт", "Циклические виды", "Шоссейные велозаезды, гравийные маршруты и вечерние городские катки", "Bike", admin);
        Sport workout = ensureSport("Воркаут и ОФП", "Функциональный тренинг", "Силовые тренировки на открытых площадках, круговой функциональный тренинг", "Dumbbell", admin);
        Sport yoga = ensureSport("Йога и стретчинг", "Здоровье и гибкость", "Практики йоги в парках и залах, мобильность суставов и восстановление", "Heart", admin);
        Sport tableTennis = ensureSport("Настольный теннис", "Ракеточные виды", "Динамичные спарринги и любительские турниры лесенкой", "Zap", admin);
        return List.of(football, basketball, running, tennis, swimming, volleyball, cycling, workout, yoga, tableTennis);
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
        Sport cycling = sports.get(6);
        Sport workout = sports.get(7);
        Sport yoga = sports.get(8);
        Sport tableTennis = sports.get(9);

        String testPwdHash = passwordEncoder.encode("SportPass123!");

        // =========================================================================
        // 1. ОБЫЧНЫЕ ПОЛЬЗОВАТЕЛИ (СПОРТСМЕНЫ И НАПАРНИКИ В РАЗНЫХ РЕГИОНАХ)
        // =========================================================================
        User alexey = createUser("alexey@sportplatform.ru", "Алексей Громов", "Москва", "Хамовники",
                "Бегаю полумарафоны (личник 1:34), по пятницам собираю баскетбол 5x5 в Лужниках. Всегда рад новым спортивным знакомым!",
                "Вечерние игровые тренировки и субботние длительные пробежки", "Вт, Чт после 19:00, Сб утро", testPwdHash);
        addSportInterest(alexey, basketball, SkillLevel.ADVANCED, true, false, "Играю разыгрывающим 6 лет");
        addSportInterest(alexey, running, SkillLevel.AMATEUR, false, false, "Темп 5:00–5:20 мин/км");
        addSportInterest(alexey, workout, SkillLevel.AMATEUR, false, false, "Турник, брусья и функциональная база");

        User maria = createUser("maria@sportplatform.ru", "Мария Соколова", "Москва", "Пресненский",
                "Люблю большой теннис, плавание и утренние пробежки в парке Горького. Ищу партнёров для регулярных спаррингов по выходным.",
                "Парные спарринги, клубные пробежки и бассейн", "Сб, Вс с 09:00 до 14:00, Ср вечер", testPwdHash);
        addSportInterest(maria, tennis, SkillLevel.AMATEUR, true, false, "Уровень NTRP 3.5, стабильная задняя линия");
        addSportInterest(maria, running, SkillLevel.BEGINNER, false, false, "Комфортный разговорный темп 6:00 мин/км");
        addSportInterest(maria, swimming, SkillLevel.AMATEUR, false, true, "Тренирую кроль в 50м бассейне «Чайка»");

        User dmitry = createUser("dmitry@sportplatform.ru", "Дмитрий Волков", "Москва", "Сокольники",
                "Капитан любительской футбольной команды и участник волейбольных сборов. Часто ищу +2-3 игроков на вечерний манеж.",
                "Командные матчи 5x5 и 6x6", "Пн, Ср, Пт 20:00", testPwdHash);
        addSportInterest(dmitry, football, SkillLevel.COMPETITIVE, true, false, "Любительская лига 8x8 и манеж 5x5");
        addSportInterest(dmitry, volleyball, SkillLevel.AMATEUR, false, false, "Доигровщик, уверенный приём");
        addSportInterest(dmitry, tableTennis, SkillLevel.AMATEUR, false, false, "Играю на счёт в Нескучном саду");

        User ekaterina = createUser("ekaterina@sportplatform.ru", "Екатерина Смирнова", "Санкт-Петербург", "Петроградский",
                "Организую пробежки на Крестовском острове и играю в пляжный волейбол. Обожаю активные выходные!",
                "Клубные пробежки, волейбол 4x4 и стретчинг", "Ср 19:30, Сб и Вс с 10:00", testPwdHash);
        addSportInterest(ekaterina, running, SkillLevel.ADVANCED, true, false, "Готовлюсь к марафону «Белые ночи»");
        addSportInterest(ekaterina, volleyball, SkillLevel.AMATEUR, false, false, "Связующий игрок");
        addSportInterest(ekaterina, yoga, SkillLevel.AMATEUR, false, false, "Восстановительная практика после бега");

        User artem = createUser("artem@sportplatform.ru", "Артём Ковалёв", "Москва", "Крылатское",
                "Шоссейный велоспорт по малому и большому кольцу в Крылатском, зимой — бег и ОФП. Ищу компанию в пелотон на выходные.",
                "Групповые велотренировки 50–90 км и воркаут", "Вт, Чт 07:30, Вс 09:00", testPwdHash);
        addSportInterest(artem, cycling, SkillLevel.ADVANCED, true, false, "Средняя скорость 33–35 км/ч на шоссейнике");
        addSportInterest(artem, workout, SkillLevel.ADVANCED, false, false, "Силовая выносливость");
        addSportInterest(artem, football, SkillLevel.AMATEUR, false, false, "Играю в защите по выходным");

        User alina = createUser("alina@sportplatform.ru", "Алина Захарова", "Казань", "Вахитовский",
                "Играю в большой теннис и бегаю вдоль набережной Казанки. С удовольствием присоединюсь к вечерним тренировкам в парке Урам.",
                "Спарринги по теннису и лёгкие пробежки 5–8 км", "Будни после 18:30, выходные", testPwdHash);
        addSportInterest(alina, tennis, SkillLevel.AMATEUR, true, false, "Играю 3 года, ищу спарринг-партнёра");
        addSportInterest(alina, running, SkillLevel.AMATEUR, false, false, "Набережная Казанки и парк Горького");
        addSportInterest(alina, yoga, SkillLevel.BEGINNER, false, true, "Утренняя йога на свежем воздухе");

        User nikita = createUser("nikita@sportplatform.ru", "Никита Морозов", "Москва", "Таганский",
                "Регулярно играю в стритбол 3x3 и настольный теннис. Всегда за динамичную игру после работы!",
                "Стритбол 3x3, баскетбол 5x5, пинг-понг", "Вт, Чт, Пт с 19:00", testPwdHash);
        addSportInterest(nikita, basketball, SkillLevel.AMATEUR, true, false, "Атакующий защитник, хороший трёхочковый");
        addSportInterest(nikita, tableTennis, SkillLevel.ADVANCED, false, false, "Рейтинг RTTF ~450");
        addSportInterest(nikita, running, SkillLevel.BEGINNER, false, false, "Кросс 5 км для кардио");

        User sergey = createUser("sergey.trail@sportplatform.ru", "Сергей Белов", "Екатеринбург", "Верх-Исетский",
                "Трейлраннер и любитель функционального тренинга. Бегаю по Уктусским горам и набережной Исети.",
                "Трейлраннинг, кросс-походы и ОФП", "Сб, Вс утро", testPwdHash);
        addSportInterest(sergey, running, SkillLevel.COMPETITIVE, true, false, "Дистанции от 15 до 42 км");
        addSportInterest(sergey, cycling, SkillLevel.AMATEUR, false, false, "Кросс-кантри MTB");

        User ksenia = createUser("ksenia@sportplatform.ru", "Ксения Орлова", "Москва", "Раменки",
                "Преподаю хатха-йогу и функциональный стретчинг для бегунов и игровиков. Плаваю в Лужниках 3 раза в неделю.",
                "Утренние практики, растяжка и заплывы в бассейне", "Пн, Ср, Пт утро, Вс 11:00", testPwdHash);
        addSportInterest(ksenia, yoga, SkillLevel.COMPETITIVE, true, false, "Сертифицированный инструктор по йоге и мобильности");
        addSportInterest(ksenia, swimming, SkillLevel.ADVANCED, false, false, "Плаваю 2 км за тренировку");
        addSportInterest(ksenia, tennis, SkillLevel.BEGINNER, false, true, "Хочу освоить подачу и игру с лета");

        User igor = createUser("igor@sportplatform.ru", "Игорь Данилов", "Новосибирск", "Центральный",
                "Организую любительский волейбол и мини-футбол в Новосибирске. Буду рад новым участникам в нашей команде!",
                "Командные игры в зале и на открытых площадках", "Ср, Пт 19:30, Вс 12:00", testPwdHash);
        addSportInterest(igor, volleyball, SkillLevel.ADVANCED, true, false, "Центральный блокирующий");
        addSportInterest(igor, football, SkillLevel.AMATEUR, false, false, "Мини-футбол 5x5");

        // =========================================================================
        // 2. ОФИЦИАЛЬНЫЕ АККАУНТЫ ОРГАНИЗАЦИЙ И СООБЩЕСТВА
        // =========================================================================
        // 2.1 Одобренная организация №1: Спортивная организация «Темп» (Москва)
        User clubOwnerApproved = createUser("club@sportplatform.ru", "Спортивная организация «Темп»", "Москва", "Лужники",
                "Официальный аккаунт городской спортивной организации «Темп».",
                "Групповые беговые тренировки, плавание и ОФП", "Ежедневно", testPwdHash);
        clubOwnerApproved.setShowInPartnerSearch(false);
        clubOwnerApproved = userRepository.save(clubOwnerApproved);

        Organization approvedOrg = new Organization();
        approvedOrg.setOwner(clubOwnerApproved);
        approvedOrg.setName("Спортивная организация «Темп»");
        approvedOrg.setOrgType(OrganizationType.SPORTS_CLUB);
        approvedOrg.setCity("Москва");
        approvedOrg.setDescription("Крупнейшая спортивная и беговая организация в Лужниках. Проводим еженедельные бесплатные субботние пробежки, интервальные тренировки на дорожке, заплывы в открытом бассейне и игровые сборы.");
        approvedOrg.setRepresentativeName("Спортивная организация «Темп»");
        approvedOrg.setModerationContact("+7 (999) 111-22-33 (приватный контакт для администрации)");
        approvedOrg.setPublicContacts("VK: vk.com/temp_run_club · Тел. координатора: +7 (495) 000-10-20");
        approvedOrg.setWebsiteUrl("https://temp-sport-club.example.ru");
        approvedOrg.setSocialUrl("https://vk.com/temp_run_club");
        approvedOrg.setVerificationLink("https://vk.com/temp_run_club");
        approvedOrg.setStatus(OrganizationStatus.APPROVED);
        approvedOrg.setSubmissionVersion(1);
        approvedOrg.setReviewedByAdminId(admin.getId());
        approvedOrg.setReviewedAt(Instant.now().minus(10, ChronoUnit.DAYS));
        approvedOrg.setSports(Set.of(running, swimming, workout));
        approvedOrg = organizationRepository.save(approvedOrg);
        saveHistory(approvedOrg, 1, OrganizationStatus.APPROVED, "Организация проверена и верифицирована администратором платформы", admin.getId());

        // 2.2 Одобренная организация №2: Академия ракеточных видов спорта «Арена Корт» (Москва)
        User smashOrgUser = createUser("smash@sportplatform.ru", "Академия тенниса «Арена Корт»", "Москва", "Сокольники",
                "Официальный аккаунт теннисного центра и академии ракеточных видов спорта «Арена Корт».",
                "Клубные турниры, открытые корты и спарринги", "Ежедневно с 08:00 до 23:00", testPwdHash);
        smashOrgUser.setShowInPartnerSearch(false);
        smashOrgUser = userRepository.save(smashOrgUser);

        Organization smashOrg = new Organization();
        smashOrg.setOwner(smashOrgUser);
        smashOrg.setName("Академия тенниса «Арена Корт»");
        smashOrg.setOrgType(OrganizationType.SCHOOL);
        smashOrg.setCity("Москва");
        smashOrg.setDescription("Профессиональный центр большого и настольного тенниса в Москве. Проводим открытые клубные дни, рейтинговые спарринги по уровням NTRP и вечерние турниры лесенкой.");
        smashOrg.setRepresentativeName("Академия тенниса «Арена Корт»");
        smashOrg.setModerationContact("+7 (495) 777-55-44 · admin@arenacourt.example.ru");
        smashOrg.setPublicContacts("VK: vk.com/arenacourt_msk · Запись: +7 (495) 777-55-44");
        smashOrg.setWebsiteUrl("https://arenacourt.example.ru");
        smashOrg.setSocialUrl("https://vk.com/arenacourt_msk");
        smashOrg.setVerificationLink("https://vk.com/arenacourt_msk");
        smashOrg.setStatus(OrganizationStatus.APPROVED);
        smashOrg.setSubmissionVersion(1);
        smashOrg.setReviewedByAdminId(admin.getId());
        smashOrg.setReviewedAt(Instant.now().minus(7, ChronoUnit.DAYS));
        smashOrg.setSports(Set.of(tennis, tableTennis));
        smashOrg = organizationRepository.save(smashOrg);
        saveHistory(smashOrg, 1, OrganizationStatus.APPROVED, "Подтверждены правоустанавливающие реквизиты и расписание кортов", admin.getId());

        // 2.3 Одобренная организация №3: Центр циклических видов спорта «Нева Старт» (Санкт-Петербург)
        User nevaOrgUser = createUser("neva@sportplatform.ru", "Спортивный центр «Нева Старт»", "Санкт-Петербург", "Петроградский",
                "Официальный аккаунт петербургского центра бега и велоспорта «Нева Старт».",
                "Регулярные старты, велозаезды и подготовка к триатлону", "Вт, Чт, Сб, Вс", testPwdHash);
        nevaOrgUser.setShowInPartnerSearch(false);
        nevaOrgUser = userRepository.save(nevaOrgUser);

        Organization nevaOrg = new Organization();
        nevaOrg.setOwner(nevaOrgUser);
        nevaOrg.setName("Спортивный центр «Нева Старт»");
        nevaOrg.setOrgType(OrganizationType.SPORTS_CLUB);
        nevaOrg.setCity("Санкт-Петербург");
        nevaOrg.setDescription("Городской организатор открытых тренировок по бегу, шоссейному велоспорту и функциональной подготовке на Крестовском острове и Елагином острове.");
        nevaOrg.setRepresentativeName("Спортивный центр «Нева Старт»");
        nevaOrg.setModerationContact("+7 (812) 333-22-11");
        nevaOrg.setPublicContacts("VK: vk.com/nevastart_spb · Тел.: +7 (812) 333-22-11");
        nevaOrg.setWebsiteUrl("https://nevastart.example.ru");
        nevaOrg.setSocialUrl("https://vk.com/nevastart_spb");
        nevaOrg.setVerificationLink("https://vk.com/nevastart_spb");
        nevaOrg.setStatus(OrganizationStatus.APPROVED);
        nevaOrg.setSubmissionVersion(1);
        nevaOrg.setReviewedByAdminId(admin.getId());
        nevaOrg.setReviewedAt(Instant.now().minus(6, ChronoUnit.DAYS));
        nevaOrg.setSports(Set.of(running, cycling, swimming));
        nevaOrg = organizationRepository.save(nevaOrg);
        saveHistory(nevaOrg, 1, OrganizationStatus.APPROVED, "Организация проверена модератором", admin.getId());

        // 2.4 Организация НА ПРОВЕРКЕ (для демонстрации модерации жюри): «Волейбол-Сити»
        User clubOwnerPending = createUser("arena@sportplatform.ru", "Спортивная организация «Волейбол-Сити»", "Санкт-Петербург", "Петроградский",
                "Официальный аккаунт школы и спортивной организации волейбола «Волейбол-Сити».",
                "Игровые сборы и турниры выходного дня", "Вт, Чт, Вс", testPwdHash);
        clubOwnerPending.setShowInPartnerSearch(false);
        clubOwnerPending = userRepository.save(clubOwnerPending);

        Organization pendingOrg = new Organization();
        pendingOrg.setOwner(clubOwnerPending);
        pendingOrg.setName("Спортивная организация «Волейбол-Сити»");
        pendingOrg.setOrgType(OrganizationType.SPORTS_CLUB);
        pendingOrg.setCity("Санкт-Петербург");
        pendingOrg.setDescription("Регулярные сборы по классическому и пляжному волейболу для игроков уровней Начинающий+ и Любитель. Делим на равные составы на месте.");
        pendingOrg.setRepresentativeName("Спортивная организация «Волейбол-Сити»");
        pendingOrg.setModerationContact("+7 (921) 555-44-33, info@volleycity.example.ru");
        pendingOrg.setPublicContacts("https://vk.com/volleycity_spb");
        pendingOrg.setVerificationLink("https://vk.com/volleycity_spb");
        pendingOrg.setStatus(OrganizationStatus.PENDING_REVIEW);
        pendingOrg.setSubmissionVersion(1);
        pendingOrg.setSports(Set.of(volleyball));
        pendingOrg = organizationRepository.save(pendingOrg);
        saveHistory(pendingOrg, 1, OrganizationStatus.PENDING_REVIEW, "Ожидает первичной проверки администратором", null);

        // 2.5 ОТКЛОНЁННАЯ организация (для демонстрации доработки заявки): «Корт-Мастер»
        User clubOwnerRejected = createUser("start@sportplatform.ru", "Спортивная секция «Корт-Мастер»", "Москва", "Сокол",
                "Официальный аккаунт теннисной секции «Корт-Мастер».",
                "Спарринги и групповые тренировки", "Сб, Вс", testPwdHash);
        clubOwnerRejected.setShowInPartnerSearch(false);
        clubOwnerRejected = userRepository.save(clubOwnerRejected);

        Organization rejectedOrg = new Organization();
        rejectedOrg.setOwner(clubOwnerRejected);
        rejectedOrg.setName("Спортивная секция «Корт-Мастер»");
        rejectedOrg.setOrgType(OrganizationType.SECTION);
        rejectedOrg.setCity("Москва");
        rejectedOrg.setDescription("Совместная аренда кортов и проведение любительских матчей по выходным.");
        rejectedOrg.setRepresentativeName("Спортивная секция «Корт-Мастер»");
        rejectedOrg.setModerationContact("+7 (916) 777-88-99");
        rejectedOrg.setPublicContacts("Уточняется");
        rejectedOrg.setStatus(OrganizationStatus.REJECTED);
        rejectedOrg.setRejectionReason("Пожалуйста, укажите ссылку на публичную страницу или расписание кортов для подтверждения подлинности организации, а также дополните публичные контакты для участников.");
        rejectedOrg.setSubmissionVersion(1);
        rejectedOrg.setReviewedByAdminId(admin.getId());
        rejectedOrg.setReviewedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        rejectedOrg.setSports(Set.of(tennis));
        rejectedOrg = organizationRepository.save(rejectedOrg);
        saveHistory(rejectedOrg, 1, OrganizationStatus.REJECTED, rejectedOrg.getRejectionReason(), admin.getId());

        // =========================================================================
        // 3. ОТКРЫТЫЕ ПОЛЬЗОВАТЕЛЬСКИЕ СООБЩЕСТВА (COMMUNITY)
        // =========================================================================
        Organization userCommunityRun = createCommunity(
                alexey,
                "Беговое и баскетбольное комьюнити «Лужники Run & Hoops»",
                "Москва",
                "Открытое сообщество участников для вечерних игр в стритбол 3x3, баскетбол 5x5 и совместных пробежек по набережной Лужников.",
                "VK: vk.com/luzhniki_run_hoops · Координатор Алексей",
                "https://vk.com/luzhniki_run_hoops",
                Set.of(basketball, running, workout)
        );

        Organization userCommunityTennis = createCommunity(
                maria,
                "Теннисное сообщество «Корты Парка Горького»",
                "Москва",
                "Сообщество любителей большого тенниса и утреннего плавания. Ищем напарников по уровню NTRP и бронируем грунтовые и хардовые корты вместе.",
                "VK: vk.com/tennis_gorky_community",
                "https://vk.com/tennis_gorky_community",
                Set.of(tennis, swimming)
        );

        Organization userCommunityFootball = createCommunity(
                dmitry,
                "Футбольное братство «Сокольники 5x5 & 8x8»",
                "Москва",
                "Собираем регулярные футбольные матчи в манежах и на открытых полях Сокольников и Преображенки. Всегда дружеская атмосфера и честная игра без грубых фолов.",
                "VK: vk.com/sokolniki_football_club",
                "https://vk.com/sokolniki_football_club",
                Set.of(football, volleyball)
        );

        Organization userCommunitySpb = createCommunity(
                ekaterina,
                "Бег и пляжный волейбол «Крестовский Остров»",
                "Санкт-Петербург",
                "Сообщество активных жителей Петербурга: бегаем по Приморскому парку Победы и играем в волейбол каждые выходные.",
                "VK: vk.com/krestovsky_sport_spb",
                "https://vk.com/krestovsky_sport_spb",
                Set.of(running, volleyball, yoga)
        );

        Organization userCommunityCycling = createCommunity(
                artem,
                "Вело-комьюнити «Крылатские Холмы»",
                "Москва",
                "Утренние и субботние выезды на шоссейных и гравийных велосипедах. Делимся на группы по темпу (28+, 32+, 35+ км/ч), после заезда пьём кофе.",
                "VK: vk.com/krylatskoe_peloton",
                "https://vk.com/krylatskoe_peloton",
                Set.of(cycling, workout)
        );

        // Подписчики и участники организаций и сообществ
        subscribeUser(approvedOrg, clubOwnerApproved, "OWNER");
        subscribeUser(approvedOrg, alexey, "MEMBER");
        subscribeUser(approvedOrg, maria, "MEMBER");
        subscribeUser(approvedOrg, dmitry, "MEMBER");
        subscribeUser(approvedOrg, ksenia, "MEMBER");
        subscribeUser(approvedOrg, nikita, "MEMBER");

        subscribeUser(smashOrg, smashOrgUser, "OWNER");
        subscribeUser(smashOrg, maria, "MEMBER");
        subscribeUser(smashOrg, dmitry, "MEMBER");
        subscribeUser(smashOrg, nikita, "MEMBER");
        subscribeUser(smashOrg, ksenia, "MEMBER");

        subscribeUser(nevaOrg, nevaOrgUser, "OWNER");
        subscribeUser(nevaOrg, ekaterina, "MEMBER");
        subscribeUser(nevaOrg, artem, "MEMBER");

        subscribeUser(userCommunityRun, alexey, "OWNER");
        subscribeUser(userCommunityRun, maria, "ADMIN");
        subscribeUser(userCommunityRun, dmitry, "MEMBER");
        subscribeUser(userCommunityRun, nikita, "MEMBER");
        subscribeUser(userCommunityRun, artem, "MEMBER");
        subscribeUser(userCommunityRun, ksenia, "MEMBER");

        subscribeUser(userCommunityTennis, maria, "OWNER");
        subscribeUser(userCommunityTennis, alexey, "MEMBER");
        subscribeUser(userCommunityTennis, ksenia, "MEMBER");
        subscribeUser(userCommunityTennis, alina, "MEMBER");

        subscribeUser(userCommunityFootball, dmitry, "OWNER");
        subscribeUser(userCommunityFootball, alexey, "MEMBER");
        subscribeUser(userCommunityFootball, artem, "MEMBER");
        subscribeUser(userCommunityFootball, nikita, "MEMBER");
        subscribeUser(userCommunityFootball, igor, "MEMBER");

        subscribeUser(userCommunitySpb, ekaterina, "OWNER");
        subscribeUser(userCommunitySpb, maria, "MEMBER");
        subscribeUser(userCommunitySpb, sergey, "MEMBER");

        subscribeUser(userCommunityCycling, artem, "OWNER");
        subscribeUser(userCommunityCycling, alexey, "MEMBER");
        subscribeUser(userCommunityCycling, sergey, "MEMBER");

        // =========================================================================
        // 4. МЕРОПРИЯТИЯ: ПРЕДСТОЯЩИЕ (РАЗОВЫЕ И РЕГУЛЯРНЫЕ) + АРХИВНЫЕ
        // =========================================================================
        Instant now = Instant.now().truncatedTo(ChronoUnit.MINUTES);

        // --- АРХИВНЫЕ МЕРОПРИЯТИЯ (COMPLETED, в прошлом — для календаря и архива) ---
        Event evPast1 = createEventEntity(
                "Воскресный кросс 8 км по Воробьёвым горам",
                "Совместная утренняя пробежка по видовой набережной с разминкой, специальными беговыми упражнениями и растяжкой у воды.",
                running, alexey, userCommunityRun,
                "Москва", "Воробьёвская набережная, смотровая площадка",
                55.7103, 37.5426,
                now.minus(12, ChronoUnit.DAYS),
                now.minus(12, ChronoUnit.DAYS).plus(90, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.ANY, "Кросс 8 км",
                "Бесплатно", "Кроссовки, ветровка, бутылка воды", 25,
                EventStatus.COMPLETED
        );

        Event evPast2 = createEventEntity(
                "Клубный матч по мини-футболу 5x5 в Сокольниках",
                "Динамичный вечерний сбор 3 команд по 5 человек. Отыграли 90 минут в отличном темпе без травм!",
                football, dmitry, userCommunityFootball,
                "Москва", "Сокольнический Вал, 1Б, Манеж «Спартак»",
                55.7923, 37.6712,
                now.minus(8, ChronoUnit.DAYS),
                now.minus(8, ChronoUnit.DAYS).plus(90, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.AMATEUR, "Матч 5x5",
                "Аренда манежа 500 руб.", "Сороконожки, гетры", 15,
                EventStatus.COMPLETED
        );

        Event evPast3 = createEventEntity(
                "Открытый спарринг по большому теннису в Лужниках",
                "Отработка глубоких ударов с задней линии и парный тай-брейк на открытых кортах.",
                tennis, maria, userCommunityTennis,
                "Москва", "Лужнецкая набережная, 24, Дворец тенниса",
                55.7192, 37.5594,
                now.minus(5, ChronoUnit.DAYS),
                now.minus(5, ChronoUnit.DAYS).plus(120, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.AMATEUR, "Парный спарринг",
                "Корт оплачен клубом", "Теннисная ракетка, кроссовки", 8,
                EventStatus.COMPLETED
        );

        Event evPast4 = createEventEntity(
                "Вечерний стритбол 3x3 на площадке «Под мостом»",
                "Серия коротких матчей до 11 очков под освещением прожекторов.",
                basketball, alexey, userCommunityRun,
                "Москва", "Лужнецкая набережная, 24, площадка «Под мостом»",
                55.7158, 37.5537,
                now.minus(2, ChronoUnit.DAYS),
                now.minus(2, ChronoUnit.DAYS).plus(90, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.ANY, "Стритбол 3x3",
                "Свободный вход", "Баскетбольные кроссовки и вода", 12,
                EventStatus.COMPLETED
        );

        // --- ПРЕДСТОЯЩИЕ РАЗОВЫЕ МЕРОПРИЯТИЯ ---
        // Событие 1: Баскетбол в Лужниках (через 18 часов, OPEN)
        Event evBasketball = createEventEntity(
                "Пятничный баскетбол 5x5 в Лужниках (Свободный вход)",
                "Дружеская вечерняя игра на открытом корте с профессиональным покрытием. Делимся на 3 команды по 5 человек, играем до 16 очков или 10 минут. Мячи Molten 7-ка есть.",
                basketball, alexey, userCommunityRun,
                "Москва", "Лужнецкая набережная, 24, площадка «Под мостом»",
                55.7158, 37.5537,
                now.plus(18, ChronoUnit.HOURS),
                now.plus(20, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.AMATEUR, "Игровая встреча 5x5",
                "Бесплатно. Уважительная игра без грубых фолов.",
                "Светлая и тёмная футболки, вода, кроссовки для улицы", 15,
                EventStatus.PUBLISHED
        );

        // Событие 2: Большой теннис по заявке (через 2 дня, APPROVAL_REQUIRED)
        Event evTennis = createEventEntity(
                "Парный теннисный спарринг NTRP 3.0–4.0 на грунте",
                "Собираем 4 игроков близкого уровня на 2 часа парной игры со сменой партнёров. Запись по заявке, чтобы подобрать ровный и интересный состав.",
                tennis, maria, userCommunityTennis,
                "Москва", "Пресненский Вал, 27, Теннисный центр «Пресня», корт №3",
                55.7684, 37.5641,
                now.plus(2, ChronoUnit.DAYS),
                now.plus(2, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS),
                JoinMode.APPROVAL_REQUIRED, SkillLevel.AMATEUR, "Парный спарринг 2x2",
                "Аренда корта делится поровну между 4 участниками на месте. В заявке кратко укажите ваш опыт игры.",
                "Теннисная ракетка, обувь для грунта (clay), банка новых мячей приветствуется", 4,
                EventStatus.PUBLISHED
        );

        // Событие 3: Вечерний футбол 5x5 в Сокольниках (через 3 дня, APPROVAL_REQUIRED)
        Event evFootball = createEventEntity(
                "Вечерний мини-футбол 5x5 в манеже Сокольники",
                "Интенсивный матч 90 минут в крытом манеже с искусственной травой последнего поколения. Есть просторные раздевалки, душевые и манишки.",
                football, dmitry, userCommunityFootball,
                "Москва", "Сокольнический Вал, 1Б, Манеж «Спартак», поле №2",
                55.7923, 37.6712,
                now.plus(3, ChronoUnit.DAYS),
                now.plus(3, ChronoUnit.DAYS).plus(90, ChronoUnit.MINUTES),
                JoinMode.APPROVAL_REQUIRED, SkillLevel.ADVANCED, "Матч 5x5",
                "Оргвзнос за аренду манежа — 600 руб. с игрока на месте.",
                "Сороконожки (TF) или бутсы без железных шипов, гетры", 10,
                EventStatus.PUBLISHED
        );

        // Событие 4: Заплыв и тренировка по плаванию от организации «Темп» (через 28 часов, OPEN)
        Event evSwimming = createEventEntity(
                "Техника кроля и интервалы 1500м в открытом бассейне «Чайка»",
                "Групповая тренировка под руководством тренера организации «Темп»: разбор высокого локтя, дыхания на две стороны и скоростные отрезки по 50/100 метров.",
                swimming, clubOwnerApproved, approvedOrg,
                "Москва", "Турчанинов переулок, 3с1, Бассейн «Чайка» (50 метров)",
                55.7356, 37.5944,
                now.plus(28, ChronoUnit.HOURS),
                now.plus(29, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.AMATEUR, "Тренировка на воде",
                "Вход по разовому билету или абонементу бассейна, работа тренера бесплатно от клуба «Темп».",
                "Очки для плавания, шапочка, сланцы, полотенце", 16,
                EventStatus.PUBLISHED
        );

        // Событие 5: Шоссейный велозаезд в Крылатском (через 42 часа, OPEN)
        Event evCycling = createEventEntity(
                "Утренний шоссейный выезд 45 км по малому кольцу в Крылатском",
                "Совместная тренировка вело-комьюнити «Крылатские Холмы»: 3 круга в ровном темпе со сменами в паре, затем кофе и разбор маршрута у велотрека.",
                cycling, artem, userCommunityCycling,
                "Москва", "Крылатская улица, 10, Олимпийский велотрек (главная площадь)",
                55.7634, 37.4335,
                now.plus(42, ChronoUnit.HOURS),
                now.plus(44, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.ADVANCED, "Групповой заезд",
                "Участие бесплатное. Наличие велошлема обязательно для допуска в группу!",
                "Исправный шоссейный/гравийный велосипед, шлем, фляга с изотоником, ремкомплект", 18,
                EventStatus.PUBLISHED
        );

        // Событие 6: Турнир лесенкой по настольному теннису от «Арена Корт» (через 52 часа, OPEN)
        Event evTableTennis = createEventEntity(
                "Вечерний клубный турнир по настольному теннису (8 столов)",
                "Играем по круговой системе с выходом в финал. Отличная возможность сыграть 6–7 матчей с разными по стилю соперниками за один вечер.",
                tableTennis, smashOrgUser, smashOrg,
                "Москва", "ул. Русаковская, 24, Центр ракеточных видов спорта «Арена Корт»",
                55.7871, 37.6789,
                now.plus(52, ChronoUnit.HOURS),
                now.plus(54, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.ANY, "Любительский турнир",
                "Вход свободный по предварительной записи на платформе. Мячи DHS 3* предоставляются.",
                "Ракетка (при необходимости выдаём клубную), сменная спортивная обувь", 16,
                EventStatus.PUBLISHED
        );

        // Событие 7: Воркаут и функциональный тренинг на ВДНХ (через 66 часов, OPEN)
        Event evWorkout = createEventEntity(
                "Функциональный воркаут и калистеника в спортивной зоне ВДНХ",
                "Круговая тренировка на свежем воздухе: подтягивания, выходы силой, отжимания на брусьях, работа с петлями TRX и кор.",
                workout, alexey, userCommunityRun,
                "Москва", "Проспект Мира, 119, Спортивный кластер ВДНХ (у Мичуринского сада)",
                55.8310, 37.6285,
                now.plus(66, ChronoUnit.HOURS),
                now.plus(67, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.ANY, "Круговая тренировка",
                "Бесплатно, нагрузка масштабируется под любой уровень подготовки.",
                "Удобная форма, перчатки или магнезия по желанию, вода", 20,
                EventStatus.PUBLISHED
        );

        // Событие 8: Пляжный волейбол и пробежка в Санкт-Петербурге (через 40 часов, OPEN)
        Event evSpbVolley = createEventEntity(
                "Волейбол 4x4 и разминочный кросс на Крестовском острове",
                "Начинаем с лёгкой разминки 3 км по Приморскому парку Победы, затем играем 2 часа в волейбол на открытых кортах у залива.",
                volleyball, ekaterina, userCommunitySpb,
                "Санкт-Петербург", "Крестовский проспект, 21, Приморский парк Победы",
                59.9718, 30.2462,
                now.plus(40, ChronoUnit.HOURS),
                now.plus(42, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.AMATEUR, "Игровой сбор",
                "Бесплатно, сетка и профессиональные мячи Mikasa у организатора.",
                "Спортивная форма по погоде, кроссовки, вода", 16,
                EventStatus.PUBLISHED
        );

        // Событие 9: Вечерний забег по набережным Невы от «Нева Старт» (через 76 часов, OPEN)
        Event evSpbRun = createEventEntity(
                "Вечерний темповый кросс 12 км по набережным Невы",
                "Фирменная тренировка центра «Нева Старт»: бежим через Троицкий и Дворцовый мосты в двух темповых группах (4:50 и 5:30 мин/км).",
                running, nevaOrgUser, nevaOrg,
                "Санкт-Петербург", "Петровская набережная, 2, сбор у Домика Петра I",
                59.9532, 30.3308,
                now.plus(76, ChronoUnit.HOURS),
                now.plus(77, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.AMATEUR, "Темповая пробежка",
                "Участие бесплатное, сопровождение пейсмейкеров клуба.",
                "Беговые кроссовки, светоотражающий элемент", 30,
                EventStatus.PUBLISHED
        );

        // Событие 10: Вечерний бег и стретчинг в Казани (через 48 часов, OPEN)
        Event evKazan = createEventEntity(
                "Вечерняя пробежка 7 км по Кремлёвской набережной и парку Урам",
                "Дружеский беговой сбор в центре Казани с финишем и функциональной заминкой в экстрим-парке «Урам».",
                running, alina, null,
                "Казань", "Подлужная улица, 67Б, Экстрим-парк «Урам» (главный павильон)",
                55.8021, 49.1384,
                now.plus(48, ChronoUnit.HOURS),
                now.plus(49, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.ANY, "Городская пробежка",
                "Свободное участие для всех желающих",
                "Беговая форма, кроссовки, вода", 25,
                EventStatus.PUBLISHED
        );

        // Событие 11: Трейл-забег в Екатеринбурге (через 90 часов, OPEN)
        Event evEkb = createEventEntity(
                "Горный трейл 14 км по тропам Уктусского лесопарка",
                "Набор высоты ~350 метров, живописные сосновые тропы и отработка техники спусков и подъёмов.",
                running, sergey, null,
                "Екатеринбург", "ул. Зимняя, 27, Спортивный комплекс «Уктус»",
                56.7745, 60.6478,
                now.plus(90, ChronoUnit.HOURS),
                now.plus(92, ChronoUnit.HOURS),
                JoinMode.OPEN, SkillLevel.ADVANCED, "Трейлраннинг",
                "Свободное участие",
                "Трейловые кроссовки с протектором, беговой жилет или пояс с водой", 20,
                EventStatus.PUBLISHED
        );

        // Событие 12: Онлайн-тренировка по йоге и мобильности для спортсменов (через 36 часов, OPEN)
        Event evOnlineYoga = createEventEntity(
                "Утренняя функциональная йога и мобильность суставов для бегунов",
                "Живая онлайн-практика с разбором техники: раскрытие тазобедренных суставов, укрепление стоп и снятие напряжения со спины после ударных и силовых нагрузок.",
                yoga, ksenia, null,
                "Онлайн", "Онлайн-трансляция (ссылка открывается участникам за 15 минут до начала)",
                null, null,
                now.plus(36, ChronoUnit.HOURS),
                now.plus(37, ChronoUnit.HOURS).plus(15, ChronoUnit.MINUTES),
                JoinMode.OPEN, SkillLevel.ANY, "Онлайн-практика",
                "Бесплатно для всех участников платформы",
                "Коврик для йоги, 2 опорных блока или плотные книги", 50,
                EventStatus.PUBLISHED
        );

        // --- РЕГУЛЯРНЫЕ СЕРИИ МЕРОПРИЯТИЙ (EventSeries) ---
        EventSeries runSeries = new EventSeries();
        runSeries.setTitle("Субботняя набережная 10 км с организацией «Темп»");
        runSeries.setDescription("Еженедельная пробежка по набережным Москвы-реки в трёх темповых группах (5:00, 5:40 и 6:15 мин/км) с разминкой и заминкой от координаторов.");
        runSeries.setSport(running);
        runSeries.setOrganizer(clubOwnerApproved);
        runSeries.setOrganization(approvedOrg);
        runSeries.setCity("Москва");
        runSeries.setLocationAddress("Парк Горького, Главный вход (сбор у колоннады)");
        runSeries.setLatitude(55.7312);
        runSeries.setLongitude(37.6032);
        runSeries.setDayOfWeek(6); // Суббота
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

        EventSeries tennisClubSeries = new EventSeries();
        tennisClubSeries.setTitle("Воскресный клубный день большого тенниса в «Арена Корт»");
        tennisClubSeries.setDescription("Регулярная воскресная игровая сессия на 4 кортах: короткие сеты со сменой партнёров каждые 30 минут.");
        tennisClubSeries.setSport(tennis);
        tennisClubSeries.setOrganizer(smashOrgUser);
        tennisClubSeries.setOrganization(smashOrg);
        tennisClubSeries.setCity("Москва");
        tennisClubSeries.setLocationAddress("ул. Русаковская, 24, Центр ракеточных видов спорта «Арена Корт»");
        tennisClubSeries.setLatitude(55.7871);
        tennisClubSeries.setLongitude(37.6789);
        tennisClubSeries.setDayOfWeek(7); // Воскресенье
        tennisClubSeries.setStartTimeLocal("12:00");
        tennisClubSeries.setDurationMinutes(120);
        tennisClubSeries.setJoinMode(JoinMode.OPEN);
        tennisClubSeries.setSkillLevel(SkillLevel.AMATEUR);
        tennisClubSeries.setParticipationConditions("Корты и новые мячи подготовлены академией «Арена Корт».");
        tennisClubSeries.setWhatToBring("Теннисная ракетка, кроссовки с профилем All Court");
        tennisClubSeries.setMaxParticipants(16);
        tennisClubSeries.setStartDate(LocalDate.now());
        tennisClubSeries.setActive(true);
        tennisClubSeries = seriesRepository.save(tennisClubSeries);
        List<Event> tennisOccurrences = eventService.generateOccurrencesForSeries(tennisClubSeries, 3);

        // =========================================================================
        // 5. ЗАПИСИ И ЗАЯВКИ НА МЕРОПРИЯТИЯ (АРХИВ + ТЕКУЩИЕ)
        // =========================================================================
        // Записи в архивных мероприятиях (отображаются в разделе «Мои записи» -> Календарь и Архив)
        createParticipation(evPast1, alexey, ParticipationStatus.CONFIRMED, "Темп выдержали на 100%", null);
        createParticipation(evPast1, maria, ParticipationStatus.CONFIRMED, "Отлично пробежали по набережной!", null);
        createParticipation(evPast1, ksenia, ParticipationStatus.CONFIRMED, "Спасибо за бодрое воскресное утро!", null);
        createParticipation(evPast1, artem, ParticipationStatus.CONFIRMED, "Отличная разминка", null);

        createParticipation(evPast2, dmitry, ParticipationStatus.CONFIRMED, "Капитанский сбор", null);
        createParticipation(evPast2, alexey, ParticipationStatus.CONFIRMED, "Отличный матч в манеже!", null);
        createParticipation(evPast2, artem, ParticipationStatus.CONFIRMED, "Сыграли на высшем уровне", null);
        createParticipation(evPast2, nikita, ParticipationStatus.CONFIRMED, "Готов на следующую неделю!", null);

        createParticipation(evPast3, maria, ParticipationStatus.CONFIRMED, "Организатор корта", null);
        createParticipation(evPast3, alexey, ParticipationStatus.CONFIRMED, "Спасибо за парный сет!", null);
        createParticipation(evPast3, ksenia, ParticipationStatus.CONFIRMED, "Очень классная тренировка", null);

        createParticipation(evPast4, alexey, ParticipationStatus.CONFIRMED, "Организатор встречи", null);
        createParticipation(evPast4, nikita, ParticipationStatus.CONFIRMED, "Хорошо побросали!", null);
        createParticipation(evPast4, dmitry, ParticipationStatus.CONFIRMED, "Отличная площадка", null);

        // Записи на предстоящие встречи (разнесены по времени без пересечений!)
        createParticipation(evBasketball, maria, ParticipationStatus.CONFIRMED, "Буду вовремя!", null);
        createParticipation(evBasketball, dmitry, ParticipationStatus.CONFIRMED, "Беру с собой насос и второй мяч", null);
        createParticipation(evBasketball, nikita, ParticipationStatus.CONFIRMED, "Буду в 18:45 на разминке!", null);
        createParticipation(evBasketball, artem, ParticipationStatus.CONFIRMED, "Подъеду сразу после работы", null);

        createParticipation(evTennis, alexey, ParticipationStatus.PENDING, "Играю 2 года, стабильно держу заднюю линию, хочу присоединиться!", null);
        createParticipation(evTennis, dmitry, ParticipationStatus.CONFIRMED, "Уровень 3.5, ракетка Wilson Blade, буду за 15 минут до начала", "Отлично, ждём на корте №3!");
        createParticipation(evTennis, ksenia, ParticipationStatus.PENDING, "Очень хочу сыграть парный спарринг в эти выходные!", null);
        createParticipation(evTennis, clubOwnerRejected, ParticipationStatus.REJECTED, "Только начинаю держать ракетку, первый раз на корте", "В этот раз собираем спарринг уровня 3.0+, но будем рады видеть на открытой тренировке для начинающих!");

        createParticipation(evFootball, artem, ParticipationStatus.CONFIRMED, "Играю в защите, сороконожки есть", "Принято, в основном составе!");
        createParticipation(evFootball, nikita, ParticipationStatus.CONFIRMED, "Готов побегать в полузащите", "Добро пожаловать!");
        createParticipation(evFootball, alexey, ParticipationStatus.PENDING, "Если останется место в пятёрке — с радостью подключусь!", null);

        createParticipation(evSwimming, maria, ParticipationStatus.CONFIRMED, "Плыву по 3-й дорожке", null);
        createParticipation(evSwimming, ksenia, ParticipationStatus.CONFIRMED, "С удовольствием поработаю над техникой гребка", null);
        createParticipation(evSwimming, alexey, ParticipationStatus.CONFIRMED, "Отличное восстановление после баскетбола", null);

        createParticipation(evCycling, alexey, ParticipationStatus.CONFIRMED, "Еду в группе 32+ км/ч", null);
        createParticipation(evCycling, sergey, ParticipationStatus.CONFIRMED, "В Москве в командировке, взял шоссейник в прокат!", null);

        createParticipation(evTableTennis, dmitry, ParticipationStatus.CONFIRMED, "Буду со своей ракеткой Butterfly", null);
        createParticipation(evTableTennis, nikita, ParticipationStatus.CONFIRMED, "Записываюсь в основную сетку!", null);

        createParticipation(evWorkout, artem, ParticipationStatus.CONFIRMED, "Отличная площадка на ВДНХ", null);
        createParticipation(evWorkout, ksenia, ParticipationStatus.CONFIRMED, "Проведу 10-минутную заминку и растяжку в конце", null);

        createParticipation(evSpbVolley, sergey, ParticipationStatus.CONFIRMED, "Буду на Крестовском!", null);
        createParticipation(evSpbRun, ekaterina, ParticipationStatus.CONFIRMED, "Бегу в группе 4:50 мин/км", null);
        createParticipation(evOnlineYoga, maria, ParticipationStatus.CONFIRMED, "Подключусь утром с ковриком!", null);
        createParticipation(evOnlineYoga, ekaterina, ParticipationStatus.CONFIRMED, "Супер тема для бегунов!", null);

        if (!runOccurrences.isEmpty()) {
            Event firstRun = runOccurrences.getFirst();
            createParticipation(firstRun, alexey, ParticipationStatus.CONFIRMED, null, null);
            createParticipation(firstRun, maria, ParticipationStatus.CONFIRMED, null, null);
            createParticipation(firstRun, dmitry, ParticipationStatus.CONFIRMED, null, null);
            createParticipation(firstRun, ksenia, ParticipationStatus.CONFIRMED, null, null);
        }

        if (!tennisOccurrences.isEmpty()) {
            Event firstTennisClub = tennisOccurrences.getFirst();
            createParticipation(firstTennisClub, maria, ParticipationStatus.CONFIRMED, null, null);
            createParticipation(firstTennisClub, nikita, ParticipationStatus.CONFIRMED, null, null);
        }

        // =========================================================================
        // 6. ЖИВЫЕ ОБСУЖДЕНИЯ В КАРТОЧКАХ МЕРОПРИЯТИЙ
        // =========================================================================
        DiscussionMessage m1 = saveDiscussion(evBasketball, maria,
                "Подскажите, пожалуйста, есть ли рядом с площадкой кулер или лучше взять побольше воды с собой?",
                "https://luzhniki.ru", null);
        saveDiscussion(evBasketball, alexey,
                "Мария, в 100 метрах у павильона проката есть вендинговый автомат и кафе, но бутылку воды 0.7л лучше захватить сразу на корт!",
                null, m1.getId());
        saveDiscussion(evBasketball, nikita,
                "Ребята, я возьму с собой колонку с негромкой музыкой для разминки и запасной мяч Wilson Evolution!",
                null, null);
        saveDiscussion(evBasketball, dmitry,
                "Супер! Я тоже захвачу цветные манишки, чтобы не путаться при смене пятёрок.",
                null, null);

        DiscussionMessage tm1 = saveDiscussion(evTennis, dmitry,
                "Мария, подскажите, пожалуйста: играем на открытом грунте или под куполом в случае дождя?",
                null, null);
        saveDiscussion(evTennis, maria,
                "Дмитрий, корт №3 с раздвижным навесом, поэтому игра состоится в любую погоду! Новые мячи Head Tour уже купила.",
                null, tm1.getId());

        saveDiscussion(evFootball, artem,
                "Парни, сбор в раздевалке №4 за 15 минут до начала, чтобы ровно в начале часа выйти на поле!",
                null, null);

        saveDiscussion(evSwimming, clubOwnerApproved,
                "Уважаемые участники! Сбор группы в холле бассейна «Чайка» за 20 минут до начала воды. Тренер выдаст клубные досточки и колобашки на бортике.",
                "https://chayka-sport.ru", null);

        if (!runOccurrences.isEmpty()) {
            Event firstRun = runOccurrences.getFirst();
            DiscussionMessage rm1 = saveDiscussion(firstRun, ksenia,
                    "Всем привет! Будет ли работать камера хранения для рюкзаков на старте у Главного входа?",
                    null, null);
            saveDiscussion(firstRun, clubOwnerApproved,
                    "Ксения, да, конечно! Наш клубный шатёр и закрытые боксы для вещей работают с 09:30 у правой колоннады Парка Горького.",
                    null, rm1.getId());
        }

        // =========================================================================
        // 7. ДРУЗЬЯ / НАПАРНИКИ И ЛИЧНЫЕ СООБЩЕНИЯ
        // =========================================================================
        createFriendship(alexey, maria, FriendshipStatus.ACCEPTED,
                "Привет! Часто бегаем в Лужниках и Парке Горького, давай держаться на связи.");
        createFriendship(artem, alexey, FriendshipStatus.ACCEPTED,
                "Алексей, отлично потренировались на набережной! Добавляйся в друзья.");
        createFriendship(ksenia, alexey, FriendshipStatus.ACCEPTED,
                "Рада знакомству на воскресном кроссе!");
        createFriendship(dmitry, alexey, FriendshipStatus.PENDING,
                "Алексей, круто сыграли в баскетбол в Лужниках! Давай дружить на платформе.");
        createFriendship(nikita, alexey, FriendshipStatus.PENDING,
                "Привет! Видел твои сборы по стритболу, буду рад быть на связи.");

        createFriendship(maria, ksenia, FriendshipStatus.ACCEPTED,
                "Ксения, пойдём вместе в бассейн «Чайка» на этой неделе!");
        createFriendship(dmitry, maria, FriendshipStatus.ACCEPTED,
                "Мария, спасибо за отличные теннисные спарринги!");
        createFriendship(ekaterina, maria, FriendshipStatus.PENDING,
                "Будешь в Петербурге — обязательно побежали вместе по Крестовскому!");

        // Живая переписка в личных сообщениях (включая непрочитанные для демонстрации счётчика)
        Instant dmBase = now.minus(3, ChronoUnit.HOURS);
        createDirectMessage(maria, alexey,
                "Привет, Алексей! Ты в эту субботу бежишь 10 км с клубом «Темп» в Парке Горького?",
                true, dmBase);
        createDirectMessage(alexey, maria,
                "Привет, Маша! Да, планирую бежать в группе по 5:00 мин/км. А ты идёшь?",
                true, dmBase.plus(12, ChronoUnit.MINUTES));
        createDirectMessage(maria, alexey,
                "Да, я записалась! И ещё оставила место на вечерний баскетбол в Лужниках, до встречи на площадке!",
                false, dmBase.plus(25, ChronoUnit.MINUTES));

        createDirectMessage(artem, alexey,
                "Лёша, привет! Возьмёшь меня в это воскресенье на веловыезд в Крылатское? Могу дать второй шоссейник!",
                false, dmBase.plus(40, ChronoUnit.MINUTES));

        createDirectMessage(ksenia, maria,
                "Маша, привет! Напоминаю, что завтра берём очки и лопатки в бассейн «Чайка» :)",
                false, dmBase.plus(50, ChronoUnit.MINUTES));

        // =========================================================================
        // 8. ОБРАЩЕНИЯ В ПОДДЕРЖКУ И ЧАТ С МОДЕРАТОРАМИ
        // =========================================================================
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
        tInProgress.setSubject("Уточнение по срокам рассмотрения заявки организации «Волейбол-Сити»");
        tInProgress.setDescription("Добрый день! Мы подали заявку на верификацию волейбольной организации. Подскажите, нужны ли от нас дополнительные ссылки на фото с тренировок?");
        tInProgress.setTargetType("ORGANIZATION");
        tInProgress.setTargetId(pendingOrg.getId());
        tInProgress.setStatus(TicketStatus.IN_PROGRESS);
        tInProgress.setAssignedAdminId(admin.getId());
        tInProgress = ticketRepository.save(tInProgress);
        saveTicketMessage(tInProgress, clubOwnerPending, false, tInProgress.getDescription());
        saveTicketMessage(tInProgress, admin, true, "Здравствуйте! Заявка уже взята в работу модератором, публичной ссылки на группу VK достаточно. Сегодня примем решение.");

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

        // Чат технической поддержки
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

        // =========================================================================
        // 9. УВЕДОМЛЕНИЯ ДЛЯ ДЕМОНСТРАЦИИ
        // =========================================================================
        createNotification(alexey, NotificationType.FRIEND_REQUEST_RECEIVED,
                "Новые запросы в друзья (2)",
                "Дмитрий Волков и Никита Морозов хотят добавить вас в список спортивных друзей.",
                "/friends");
        createNotification(alexey, NotificationType.PARTICIPATION_APPROVED,
                "Новые участники на «Пятничный баскетбол 5x5 в Лужниках»",
                "К вашему сбору присоединились Мария Соколова, Дмитрий Волков, Никита Морозов и Артём Ковалёв.",
                "/events/" + evBasketball.getId());
        createNotification(alexey, NotificationType.SUPPORT_CHAT_REPLY,
                "Новый ответ в чате поддержки",
                "Модератор ответил на ваш вопрос об экспорте календаря .ics.",
                "/support/chat");

        createNotification(maria, NotificationType.PARTICIPATION_REQUESTED,
                "Новые заявки на «Парный теннисный спарринг»",
                "Алексей Громов и Ксения Орлова подали заявки на участие в вашем мероприятии.",
                "/events/" + evTennis.getId());
        createNotification(maria, NotificationType.FRIEND_REQUEST_RECEIVED,
                "Запрос в друзья из Санкт-Петербурга",
                "Екатерина Смирнова хочет добавить вас в спортивные друзья.",
                "/friends");
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

    private Organization createCommunity(User owner, String name, String city, String description, String publicContacts, String socialUrl, Set<Sport> sports) {
        Organization comm = new Organization();
        comm.setOwner(owner);
        comm.setName(name);
        comm.setOrgType(OrganizationType.COMMUNITY);
        comm.setCity(city);
        comm.setDescription(description);
        comm.setRepresentativeName(owner.getDisplayName());
        comm.setModerationContact(owner.getEmail());
        comm.setPublicContacts(publicContacts);
        comm.setSocialUrl(socialUrl);
        comm.setStatus(OrganizationStatus.APPROVED);
        comm.setSubmissionVersion(1);
        comm.setReviewedAt(Instant.now().minus(5, ChronoUnit.DAYS));
        comm.setSports(sports);
        comm = organizationRepository.save(comm);
        saveHistory(comm, 1, OrganizationStatus.APPROVED, "Создание открытого спортивного сообщества", owner.getId());
        return comm;
    }

    private void subscribeUser(Organization org, User user, String role) {
        if (orgSubscriptionRepository.findByOrganizationIdAndUserId(org.getId(), user.getId()).isPresent()) {
            return;
        }
        OrganizationSubscription sub = new OrganizationSubscription();
        sub.setOrganization(org);
        sub.setUser(user);
        sub.setMemberRole(role);
        orgSubscriptionRepository.save(sub);
    }

    private Event createEventEntity(
            String title,
            String description,
            Sport sport,
            User organizer,
            Organization organization,
            String city,
            String address,
            Double lat,
            Double lng,
            Instant startsAt,
            Instant endsAt,
            JoinMode joinMode,
            SkillLevel skillLevel,
            String format,
            String conditions,
            String bring,
            Integer maxParticipants,
            EventStatus status
    ) {
        Event ev = new Event();
        ev.setTitle(title);
        ev.setDescription(description);
        ev.setSport(sport);
        ev.setOrganizer(organizer);
        ev.setOrganization(organization);
        ev.setCity(city);
        ev.setLocationAddress(address);
        ev.setLatitude(lat);
        ev.setLongitude(lng);
        ev.setStartsAt(startsAt);
        ev.setEndsAt(endsAt);
        ev.setJoinMode(joinMode);
        ev.setSkillLevel(skillLevel);
        ev.setActivityFormat(format);
        ev.setParticipationConditions(conditions);
        ev.setWhatToBring(bring);
        ev.setMaxParticipants(maxParticipants);
        ev.setStatus(status);
        return eventRepository.save(ev);
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

    private DiscussionMessage saveDiscussion(Event event, User author, String content, String linkUrl, UUID replyToId) {
        DiscussionMessage m = new DiscussionMessage();
        m.setEvent(event);
        m.setAuthor(author);
        m.setContent(content);
        m.setExternalLinkUrl(linkUrl);
        m.setReplyToMessageId(replyToId);
        return discussionMessageRepository.save(m);
    }

    private void createFriendship(User requester, User addressee, FriendshipStatus status, String message) {
        Friendship f = new Friendship();
        f.setRequester(requester);
        f.setAddressee(addressee);
        f.setStatus(status);
        f.setMessage(message);
        friendshipRepository.save(f);
    }

    private void createDirectMessage(User sender, User recipient, String content, boolean read, Instant createdAt) {
        DirectMessage dm = new DirectMessage();
        dm.setSender(sender);
        dm.setRecipient(recipient);
        dm.setContent(content);
        dm.setRead(read);
        dm.setCreatedAt(createdAt);
        directMessageRepository.save(dm);
    }

    private void createNotification(User user, NotificationType type, String title, String message, String linkUrl) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setLinkUrl(linkUrl);
        notificationRepository.save(n);
    }

    private void saveHistory(Organization org, int ver, OrganizationStatus st, String reason, UUID adminId) {
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
