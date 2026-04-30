import {
  usersTable,
  destinationsTable,
  churchesTable,
  marketplaceItemsTable,
  mezmursTable,
  newsPostsTable,
  quizzesTable,
  quizQuestionsTable,
  quizChallengesTable,
  bookmarksTable,
  userBadgesTable,
  streaksTable,
  commentsTable,
  commentLikesTable,
  reactionsTable,
  notificationsTable,
  systemSettingsTable,
  auditLogTable,
  badgesTable,
} from "./schema/index.js";
import bcrypt from "bcryptjs";

/**
 * Comprehensive seed file with realistic Ethiopian Orthodox Christian examples
 * for all features in the application.
 */

export async function seedExamples(db: any) {
  console.log("Seeding realistic examples for all features...");

  // === USERS ===
  const passwordHash = await bcrypt.hash("password123", 10);
  
  const users = await db.insert(usersTable).values([
    {
      email: "abraham.tewodros@example.com",
      name: "Abraham Tewodros",
      passwordHash,
      displayName: "Abraham T.",
      avatarUrl: "https://i.pravatar.cc/150?u=abraham",
      bio: "Devoted Orthodox Christian from Addis Ababa. Love visiting ancient churches and learning about our faith.",
      isPublic: true,
      role: "user",
    },
    {
      email: "sarah.mekonnen@example.com",
      name: "Sarah Mekonnen",
      passwordHash,
      displayName: "Sarah M.",
      avatarUrl: "https://i.pravatar.cc/150?u=sarah",
      bio: "Pilgrimage enthusiast. Visited Lalibela 3 times and counting!",
      isPublic: true,
      role: "user",
    },
    {
      email: "priest.kestin@example.com",
      name: "Kestin Gebremariam",
      passwordHash,
      displayName: "Father Kestin",
      avatarUrl: "https://i.pravatar.cc/150?u=kestin",
      bio: "Orthodox priest serving in the northern diocese for 15 years.",
      isPublic: true,
      role: "user",
    },
    {
      email: "meron.bekele@example.com",
      name: "Meron Bekele",
      passwordHash,
      displayName: "Meron B.",
      avatarUrl: "https://i.pravatar.cc/150?u=meron",
      bio: "Sunday school teacher and choir member at Kidist Selassie church.",
      isPublic: true,
      role: "user",
    },
    {
      email: "dawit.haile@example.com",
      name: "Dawit Haile",
      passwordHash,
      displayName: "Dawit H.",
      avatarUrl: "https://i.pravatar.cc/150?u=dawit",
      bio: "History buff fascinated by Ethiopian religious heritage and ancient manuscripts.",
      isPublic: true,
      role: "user",
    },
  ]).onConflictDoNothing().returning();

  const [user1, user2, user3, user4, user5] = users;
  console.log("✓ Seeded users");

  // === DESTINATIONS ===
  const destinations = await db.insert(destinationsTable).values([
    {
      name: "Lalibela Rock-Hewn Churches",
      region: "Amhara",
      country: "Ethiopia",
      shortDescription: "11 monolithic churches carved from rock in the 12th century",
      description: "Lalibela is a pilgrimage site for Ethiopian Orthodox Christians. The 11 rock-hewn churches were carved out of solid rock in the 12th century under King Lalibela. Each church is connected by tunnels and passageways, creating a sacred underground city. The site is a UNESCO World Heritage site and one of the wonders of the world.",
      imageUrl: "https://images.unsplash.com/photo-1596395327369-0bca5a6e9a8c?w=800",
      gallery: [
        "https://images.unsplash.com/photo-1596395327369-0bca5a6e9a8c?w=400",
        "https://images.unsplash.com/photo-1596395327369-0bca5a6e9a8c?w=400",
      ],
      latitude: 12.0325,
      longitude: 39.0425,
      bestSeason: "October to March",
      feastDay: "Timket (Epiphany) - January 19",
      founded: "12th Century",
      isFeatured: true,
    },
    {
      name: "Debre Libanos Monastery",
      region: "Oromia",
      country: "Ethiopia",
      shortDescription: "Ancient monastery founded by Saint Tekle Haymanot",
      description: "Founded in the 13th century by Saint Tekle Haymanot, one of Ethiopia's most revered saints. The monastery sits on a cliff overlooking the Jemma River Gorge. It's an important pilgrimage site and center of Orthodox Christian learning. The monastery complex includes ancient churches, manuscripts, and religious artifacts.",
      imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800",
      gallery: [],
      latitude: 9.8,
      longitude: 38.9,
      bestSeason: "Year-round",
      feastDay: "Feast of St. Tekle Haymanot - December 24",
      founded: "13th Century",
      isFeatured: true,
    },
    {
      name: "Axum (Aksum)",
      region: "Tigray",
      country: "Ethiopia",
      shortDescription: "Ancient capital with the Church of Our Lady Mary of Zion",
      description: "Axum was the capital of the ancient Axumite Kingdom and is home to the Church of Our Lady Mary of Zion, which tradition says houses the Ark of the Covenant. The city features towering stelae (obelisks), ancient ruins, and is considered the holiest city in Ethiopian Orthodox Christianity. Pilgrims visit to see the Ark's sanctuary and participate in religious festivals.",
      imageUrl: "https://images.unsplash.com/photo-1597839810455-8a3f0cc9bb8b?w=800",
      gallery: [],
      latitude: 14.13,
      longitude: 38.71,
      bestSeason: "November to February",
      feastDay: "Maryam Zion - November 30",
      founded: "1st Century AD",
      isFeatured: true,
    },
    {
      name: "Gondar Castles and Churches",
      region: "Amhara",
      country: "Ethiopia",
      shortDescription: "17th century royal capital with Fasil Ghebbi fortress complex",
      description: "Gondar was the capital of Ethiopia in the 17th and 18th centuries. The Fasil Ghebbi fortress complex includes castles, palaces, and churches built by Emperor Fasilides and his successors. The Church of Debre Berhan Selassie, with its famous angel murals on the ceiling, is a masterpiece of Ethiopian religious art.",
      imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800",
      gallery: [],
      latitude: 12.6,
      longitude: 37.47,
      bestSeason: "September to April",
      feastDay: "Timket - January 19",
      founded: "17th Century",
      isFeatured: false,
    },
    {
      name: "Lake Tana Monasteries",
      region: "Amhara",
      country: "Ethiopia",
      shortDescription: "Ancient monasteries on islands in Lake Tana",
      description: "Lake Tana, the largest lake in Ethiopia, is home to centuries-old monasteries on its islands. These include Ura Kidane Mehret, Narga Selassie, and Debre Mariam. The monasteries house ancient manuscripts, religious artifacts, and stunning murals. Many are accessible only by boat, adding to their mystical allure.",
      imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
      gallery: [],
      latitude: 11.86,
      longitude: 37.35,
      bestSeason: "October to June",
      feastDay: "Meskel - September 27",
      founded: "14th Century",
      isFeatured: true,
    },
    {
      name: "Debre Damo Monastery",
      region: "Tigray",
      country: "Ethiopia",
      shortDescription: "Ancient monastery accessible only by rope",
      description: "Founded in the 6th century by Abune Aregawi, Debre Damo sits atop a flat-topped mountain. The only access is by climbing a sheer cliff using a leather rope. The monastery preserves some of Ethiopia's oldest church buildings and most precious manuscripts. Women are not permitted to enter the monastery grounds.",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      gallery: [],
      latitude: 14.373,
      longitude: 39.289,
      bestSeason: "October to March",
      feastDay: "Feast of Abune Aregawi - October 14",
      founded: "6th Century",
      isFeatured: false,
    },
    {
      name: "Entoto Maryam Church",
      region: "Addis Ababa",
      country: "Ethiopia",
      shortDescription: "Historic church where Emperor Menelik II was crowned",
      description: "Located on Mount Entoto overlooking Addis Ababa, this church was built by Emperor Menelik II in 1882. It's where he was crowned before founding Addis Ababa. The church complex includes a museum with royal artifacts and offers panoramic views of the capital city.",
      imageUrl: "https://images.unsplash.com/photo-1601312378427-b239537f4ad3?w=800",
      gallery: [],
      latitude: 9.084,
      longitude: 38.853,
      bestSeason: "Year-round",
      feastDay: "Maryam - August 15",
      founded: "1882",
      isFeatured: true,
    },
    {
      name: "Abba Garima Monastery",
      region: "Tigray",
      country: "Ethiopia",
      shortDescription: "Home to the world's oldest illustrated Christian book",
      description: "Founded by the monk Abba Garima in the 6th century, this monastery houses the Garima Gospels, the oldest known illuminated Christian manuscripts. The two books are carbon-dated to 530-660 AD and are still in remarkable condition. The monastery sits high in the mountains of Tigray.",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      gallery: [],
      latitude: 14.119,
      longitude: 39.467,
      bestSeason: "September to May",
      feastDay: "Feast of Abba Garima - September 11",
      founded: "6th Century",
      isFeatured: false,
    },
  ]).onConflictDoNothing().returning();

  console.log("✓ Seeded destinations");
  // Additional sample destinations
  await db.insert(destinationsTable).values([
    {
      name: "St. Mary's Church, Harar",
      region: "Harari",
      country: "Ethiopia",
      shortDescription: "Historic church in the ancient walled city of Harar",
      description: "Located within the UNESCO-listed old city of Harar, St. Mary's Church dates back to the 15th century and is a key pilgrimage site for local Orthodox Christians. It features beautiful frescoes and a traditional Ethiopian architectural style.",
      imageUrl: "https://images.unsplash.com/photo-1526403221625-6db2c0cce2e5?w=800",
      gallery: [],
      latitude: 9.3135,
      longitude: 42.1016,
      bestSeason: "Year-round",
      feastDay: "St. Mary's Day - August 15",
      founded: "15th Century",
      isFeatured: false,
    },
    {
      name: "Wegera Monastery",
      region: "Gojjam",
      country: "Ethiopia",
      shortDescription: "Remote monastery famous for ancient manuscripts",
      description: "Wegera Monastery sits atop a cliff in the Gojjam highlands, accessible only by footpaths. It houses a remarkable collection of Ge'ez manuscripts dating back to the 12th century, many of which are still used in liturgical services.",
      imageUrl: "https://images.unsplash.com/photo-1568572933382-74d440642117?w=800",
      gallery: [],
      latitude: 10.1234,
      longitude: 37.5678,
      bestSeason: "October to March",
      feastDay: "Feast of Saint Tekle Haymanot - December 24",
      founded: "12th Century",
      isFeatured: false,
    },
  ]).onConflictDoNothing();
  console.log("✓ Seeded additional destinations");

  // === CHURCHES ===
  const churches = await db.insert(churchesTable).values([
    {
      name: "Holy Trinity Cathedral",
      city: "Addis Ababa",
      country: "Ethiopia",
      address: "Arat Kilo, Addis Ababa, Ethiopia",
      latitude: 9.0272,
      longitude: 38.7468,
      phone: "+251 11 551 7777",
      website: "https://www.holytrinitycathedral.org",
      priest: "Abune Mathias",
      liturgyTimes: "Sunday: 6:00 AM, 8:00 AM, 10:00 AM",
      imageUrl: "https://images.unsplash.com/photo-1548625361-1d94651a28bf?w=800",
      description: "The largest Orthodox cathedral in Ethiopia, built in 1942 to commemorate Ethiopia's liberation from Italian occupation. It serves as the burial place of Emperor Haile Selassie and Empress Menen.",
    },
    {
      name: "St. George's Cathedral",
      city: "Addis Ababa",
      country: "Ethiopia",
      address: "Piazza, Addis Ababa, Ethiopia",
      latitude: 9.0333,
      longitude: 38.7417,
      phone: "+251 11 552 3333",
      website: "",
      priest: "Abba Gebremedhin",
      liturgyTimes: "Daily: 6:00 AM, 9:00 AM",
      imageUrl: "https://images.unsplash.com/photo-1548625361-1d94651a28bf?w=800",
      description: "Traditional octagonal church dedicated to St. George, one of the most revered saints in Ethiopian Orthodoxy. Known for its beautiful murals and active congregation.",
    },
    {
      name: "Bet Giyorgis (Church of St. George)",
      city: "Lalibela",
      country: "Ethiopia",
      address: "Lalibela, Amhara, Ethiopia",
      latitude: 12.0325,
      longitude: 39.0425,
      phone: "",
      website: "",
      priest: "Abba Yohannes",
      liturgyTimes: "Daily: 5:00 AM, 7:00 AM",
      imageUrl: "https://images.unsplash.com/photo-1596395327369-0bca5a6e9a8c?w=800",
      description: "The most famous of Lalibela's rock-hewn churches, carved in the shape of a Greek cross. Dedicated to St. George, it's considered the masterpiece of the entire complex and is still used for daily services.",
    },
    {
      name: "Debre Berhan Selassie Church",
      city: "Gondar",
      country: "Ethiopia",
      address: "Fasil Ghebbi, Gondar, Ethiopia",
      latitude: 12.614,
      longitude: 37.466,
      phone: "+251 58 111 2222",
      website: "",
      priest: "Abba Teklemariam",
      liturgyTimes: "Sunday: 7:00 AM, 10:00 AM",
      imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800",
      description: "Famous for its ceiling covered with paintings of cherub-faced angels. Built in the 17th century, it's considered one of the most beautiful churches in Ethiopia with its stunning religious artwork.",
    },
    {
      name: "Kidist Selassie Cathedral",
      city: "Bahir Dar",
      country: "Ethiopia",
      address: "Kebele 03, Bahir Dar, Ethiopia",
      latitude: 11.594,
      longitude: 37.388,
      phone: "+251 58 220 1434",
      website: "",
      priest: "Abba Solomon",
      liturgyTimes: "Sunday: 7:00 AM, 10:00 AM; Daily: 6:00 AM",
      imageUrl: "https://images.unsplash.com/photo-1601312378427-b239537f4ad3?w=800",
      description: "Beautiful cathedral on the shores of Lake Tana. Known for its distinctive architecture blending traditional Ethiopian styles with modern elements. A popular pilgrimage destination.",
    },
    {
      name: "Urael Church",
      city: "Addis Ababa",
      country: "Ethiopia",
      address: "Bole, Addis Ababa, Ethiopia",
      latitude: 9.01,
      longitude: 38.76,
      phone: "+251 11 661 4488",
      website: "",
      priest: "Abba Daniel",
      liturgyTimes: "Sunday: 6:00 AM, 9:00 AM; Wednesday: 6:00 AM",
      imageUrl: "https://images.unsplash.com/photo-1601312378427-b239537f4ad3?w=800",
      description: "Modern church serving the Bole community with vibrant youth programs and community outreach. Known for its beautiful stained glass windows depicting Ethiopian saints.",
    },
    {
      name: "Bole Medhanialem Church",
      city: "Addis Ababa",
      country: "Ethiopia",
      address: "Bole Medhanialem, Addis Ababa, Ethiopia",
      latitude: 8.99,
      longitude: 38.78,
      phone: "+251 11 618 1122",
      website: "",
      priest: "Abba Michael",
      liturgyTimes: "Sunday: 6:00 AM, 8:00 AM, 10:00 AM",
      imageUrl: "https://images.unsplash.com/photo-1601312378427-b239537f4ad3?w=800",
      description: "One of the largest churches in Addis Ababa with impressive architecture. The church hosts major religious festivals and serves thousands of parishioners.",
    },
    {
      name: "Maryam Tsion Church",
      city: "Axum",
      country: "Ethiopia",
      address: "Church of Our Lady Mary of Zion, Axum, Ethiopia",
      latitude: 14.132,
      longitude: 38.719,
      phone: "",
      website: "",
      priest: "Abba Afewerq",
      liturgyTimes: "Daily: 6:00 AM; Special feast days: All day",
      imageUrl: "https://images.unsplash.com/photo-1597839810455-8a3f0cc9bb8b?w=800",
      description: "The holiest site in Ethiopian Orthodox Christianity, believed to house the Ark of the Covenant. Only men are allowed in the old church; the new church welcomes all visitors.",
    },
  ]).onConflictDoNothing().returning();

  console.log("✓ Seeded churches");

  // === MARKETPLACE ITEMS ===
  await db.insert(marketplaceItemsTable).values([
    {
      title: "Ethiopian Orthodox Bible (Amharic Ge'ez)",
      category: "Books",
      price: 45.00,
      currency: "USD",
      description: "Complete Bible in Amharic and Ge'ez with commentary from church fathers. Leather-bound, gold-edged pages. Includes Old and New Testaments with traditional Ethiopian canon.",
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
      sellerName: "Orthodox Bookstore",
      sellerLocation: "Addis Ababa, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: true,
    },
    {
      title: "Handmade Orthodox Cross (Silver)",
      category: "Religious Items",
      price: 120.00,
      currency: "USD",
      description: "Traditional Ethiopian Orthodox hand cross crafted by local artisans. Made of 925 sterling silver with intricate filigree work. Each cross is unique and blessed by a priest.",
      imageUrl: "https://images.unsplash.com/photo-1605218427306-7959a6b65d5c?w=400",
      sellerName: "Gebre Mariam Crafts",
      sellerLocation: "Axum, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: true,
    },
    {
      title: "Mezmur Collection CD - Volume 1",
      category: "Music",
      price: 15.00,
      currency: "USD",
      description: "Collection of traditional Ethiopian Orthodox hymns performed by the Mahbere Kidusan choir. Includes 20 tracks of liturgical music for various feast days.",
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
      sellerName: "Orthodox Music Center",
      sellerLocation: "Addis Ababa, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: false,
    },
    {
      title: "Prayer Rope (Mequteria) - 100 Knots",
      category: "Prayer Items",
      price: 8.50,
      currency: "USD",
      description: "Traditional Orthodox prayer rope made from black wool with 100 knots. Used for the Jesus Prayer. Handmade by monks at Debre Libanos Monastery.",
      imageUrl: "https://images.unsplash.com/photo-1629198688216-27781b8d5f73?w=400",
      sellerName: "Monastery Shop",
      sellerLocation: "Debre Libanos, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: false,
    },
    {
      title: "Icon of St. Mary - Hand-painted",
      category: "Religious Items",
      price: 85.00,
      currency: "USD",
      description: "Beautiful hand-painted icon of St. Mary (Virgin Mary) on wood panel following traditional Ethiopian iconography style. Gold leaf background. Size: 12x16 inches.",
      imageUrl: "https://images.unsplash.com/photo-1548625361-1d94651a28bf?w=400",
      sellerName: "Holy Icon Studio",
      sellerLocation: "Entoto, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: true,
    },
    {
      title: "Traditional Ethiopian Orthodox Sash (Netela)",
      category: "Clothing",
      price: 35.00,
      currency: "USD",
      description: "Hand-woven white cotton netela with colorful tibeb borders. Worn during religious ceremonies and special feast days. Made by traditional weavers in Gondar.",
      imageUrl: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=400",
      sellerName: "Gondar Weaving Co-op",
      sellerLocation: "Gondar, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: false,
    },
    {
      title: "Ethiopian Frankincense & Myrrh Set",
      category: "Prayer Items",
      price: 22.00,
      currency: "USD",
      description: "Authentic Ethiopian frankincense and myrrh harvested from the Ogaden region. Used in church ceremonies and home prayers. Includes traditional clay incense burner.",
      imageUrl: "https://images.unsplash.com/photo-1615486511484-92e172cc416d?w=400",
      sellerName: "Aroma of Ethiopia",
      sellerLocation: "Addis Ababa, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: false,
    },
    {
      title: "Kebero Hand Drum",
      category: "Music",
      price: 65.00,
      currency: "USD",
      description: "Traditional Ethiopian liturgical drum made from hollowed wood and cowhide. Used during church services and mezmur performances. Size: 12 inch diameter.",
      imageUrl: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400",
      sellerName: "Ethiopian Instruments",
      sellerLocation: "Addis Ababa, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: false,
    },
    {
      title: "Prayer Book (Se'atat) - Ge'ez & Amharic",
      category: "Books",
      price: 28.00,
      currency: "USD",
      description: "Complete Book of Hours in Ge'ez with Amharic translation. Contains daily prayers, psalms, and liturgical readings. Leather-bound with traditional Ethiopian binding.",
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
      sellerName: "Orthodox Bookstore",
      sellerLocation: "Addis Ababa, Ethiopia",
      condition: "New",
      inStock: true,
      isFeatured: true,
    },
  ]).onConflictDoNothing();

  console.log("✓ Seeded marketplace items");

  // === MEZMURS (HYMNS) ===
  const mezmurs = await db.insert(mezmursTable).values([
    {
      title: "Yibirdih New Mariam",
      artist: "Mahbere Kidusan Choir",
      category: "Liturgical",
      language: "Ge'ez",
      duration: 385,
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
      audioUrl: "https://example.com/audio/yibirdih-new-mariam.mp3",
      lyrics: "Traditional hymn praising the Virgin Mary, sung during the Feast of Maryam Zion on November 30th.",
      plays: 15420,
      isTrending: true,
    },
    {
      title: "Egziabher Yibarkih",
      artist: "St. Michael's Choir",
      category: "Praise",
      language: "Amharic",
      duration: 420,
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
      audioUrl: "https://example.com/audio/egziabher-yibarkih.mp3",
      lyrics: "A hymn of thanksgiving and praise to God, commonly sung during Sunday liturgy.",
      plays: 12350,
      isTrending: true,
    },
    {
      title: "Kidist Mariam",
      artist: "Debre Libanos Monks",
      category: "Liturgical",
      language: "Ge'ez",
      duration: 290,
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
      audioUrl: "https://example.com/audio/kidist-mariam.mp3",
      lyrics: "Ancient hymn to St. Mary, chanted by monks following traditional Ge'ez melodies.",
      plays: 9870,
      isTrending: false,
    },
    {
      title: "Medhanialem",
      artist: "Ethiopian Orthodox Youth Choir",
      category: "Contemporary",
      language: "Amharic",
      duration: 315,
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
      audioUrl: "https://example.com/audio/medhanialem.mp3",
      lyrics: "Contemporary arrangement of the classic hymn 'Savior of the World', popular among youth.",
      plays: 8900,
      isTrending: false,
    },
    {
      title: "Be-Amin Selam",
      artist: "Debre Libanos Monastery Choir",
      category: "Liturgical",
      language: "Ge'ez",
      duration: 520,
      coverUrl: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400",
      audioUrl: "https://example.com/audio/be-amin-selam.mp3",
      lyrics: "A beautiful liturgical chant invoking peace and blessings, performed by the monks during special feast days.",
      plays: 11200,
      isTrending: true,
    },
    {
      title: "Tebebke",
      artist: "Mahbere Kidusan Female Choir",
      category: "Praise",
      language: "Amharic",
      duration: 245,
      coverUrl: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400",
      audioUrl: "https://example.com/audio/tebebke.mp3",
      lyrics: "Uplifting praise song celebrating God's wisdom and guidance. A favorite in youth gatherings and Sunday school.",
      plays: 7650,
      isTrending: false,
    },
    {
      title: "Kidus Mikael",
      artist: "St. Michael's Cathedral Choir",
      category: "Liturgical",
      language: "Ge'ez",
      duration: 380,
      coverUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400",
      audioUrl: "https://example.com/audio/kidus-mikael.mp3",
      lyrics: "Ancient hymn dedicated to Archangel Michael, sung during his feast day on the 12th of every month.",
      plays: 9200,
      isTrending: true,
    },
    {
      title: "Yemeserach Yihun",
      artist: "Orthodox Sunday School Choir",
      category: "Contemporary",
      language: "Amharic",
      duration: 280,
      coverUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400",
      audioUrl: "https://example.com/audio/yemeserach.mp3",
      lyrics: "Modern praise song about faith and trust in God. Very popular among young Orthodox Christians.",
      plays: 15300,
      isTrending: true,
    },
  ]).onConflictDoNothing().returning();

  console.log("✓ Seeded mezmurs");

  // === NEWS POSTS ===
  const newsPosts = await db.insert(newsPostsTable).values([
    {
      title: "Ethiopian Orthodox Church Celebrates Timket Festival",
      slug: "ethiopian-orthodox-church-celebrates-timket-festival",
      excerpt: "Thousands of pilgrims gather in Addis Ababa and across Ethiopia to celebrate the Epiphany with colorful processions and blessings.",
      content: "The Ethiopian Orthodox Church celebrated Timket (Epiphany) with great ceremony across Ethiopia. In Addis Ababa, thousands gathered at Jan Meda for the blessing of water and the procession of the Tabots. The festival commemorates the baptism of Jesus Christ and is one of the most important religious celebrations in the Ethiopian Orthodox calendar.",
      category: "Festivals",
      author: "Orthodox News Service",
      coverUrl: "https://images.unsplash.com/photo-1548625361-1d94651a28bf?w=800",
      readMinutes: 5,
      publishedAt: new Date("2026-01-19"),
    },
    {
      title: "Ancient Manuscripts Discovered in Lalibela",
      slug: "ancient-manuscripts-discovered-in-lalibela",
      excerpt: "Archaeologists discover previously unknown Ge'ez manuscripts dating back to the 14th century in a cave near Lalibela.",
      content: "A team of archaeologists working near Lalibela has discovered a collection of ancient Ge'ez manuscripts hidden in a cave system. The manuscripts, estimated to be from the 14th century, contain biblical commentaries, liturgical texts, and hagiographies of Ethiopian saints. This discovery sheds new light on the scholarly tradition of the Ethiopian Orthodox Church during the Solomonic period.",
      category: "Heritage",
      author: "Heritage Foundation",
      coverUrl: "https://images.unsplash.com/photo-1596395327369-0bca5a6e9a8c?w=800",
      readMinutes: 8,
      publishedAt: new Date("2026-01-15"),
    },
    {
      title: "New Monastery Opens in Tigray Region",
      slug: "new-monastery-opens-in-tigray-region",
      excerpt: "The Holy Synod has blessed the opening of a new monastery dedicated to preserving ancient liturgical traditions.",
      content: "The Ethiopian Orthodox Holy Synod has officially opened a new monastery in the Tigray region. The monastery, dedicated to St. Michael, will serve as a center for theological education and preservation of ancient liturgical practices. Twenty monks have already taken up residence, with more expected to join in the coming months.",
      category: "Church News",
      author: "Church News Desk",
      coverUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800",
      readMinutes: 4,
      publishedAt: new Date("2026-01-10"),
    },
    {
      title: "Meskel Festival Draws Record Crowds at Meskel Square",
      slug: "meskel-festival-draws-record-crowds",
      excerpt: "Hundreds of thousands gather to celebrate the Finding of the True Cross with traditional bonfires and processions.",
      content: "The annual Meskel Festival drew record crowds at Meskel Square in Addis Ababa this year. Faithful from across Ethiopia and the diaspora gathered to witness the lighting of the Demera bonfire, commemorating Empress Helena's discovery of the True Cross. The festival, recognized by UNESCO as Intangible Cultural Heritage, featured traditional songs, dances, and prayers led by His Holiness the Patriarch.",
      category: "Festivals",
      author: "Cultural Heritage Reporter",
      coverUrl: "https://images.unsplash.com/photo-1548625361-1d94651a28bf?w=800",
      readMinutes: 6,
      publishedAt: new Date("2025-09-27"),
    },
    {
      title: "Sunday School Programs Expand Across Ethiopia",
      slug: "sunday-school-programs-expand",
      excerpt: "Mahbere Kidusan launches new Sunday school curriculum reaching over 100,000 children nationwide.",
      content: "Mahbere Kidusan, the youth association of the Ethiopian Orthodox Church, has launched an expanded Sunday school program reaching over 100,000 children across Ethiopia. The new curriculum focuses on biblical literacy, Ge'ez language basics, hymn singing, and Orthodox traditions. The program emphasizes hands-on learning and includes pilgrimage trips to historic sites.",
      category: "Education",
      author: "Mahbere Kidusan Communications",
      coverUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
      readMinutes: 5,
      publishedAt: new Date("2026-02-08"),
    },
    {
      title: "Annual Pilgrimage to Lalibela Attracts International Visitors",
      slug: "annual-pilgrimage-to-lalibela",
      excerpt: "Over 80,000 pilgrims, including international visitors, made the journey to Lalibela for Genna celebrations.",
      content: "The ancient rock-hewn churches of Lalibela welcomed more than 80,000 pilgrims this year for the celebration of Genna (Ethiopian Christmas). Visitors from Europe, North America, and across Africa joined Ethiopian faithful in three days of prayers, hymns, and processions. Local authorities reported the event proceeded smoothly with improved infrastructure.",
      category: "Pilgrimage",
      author: "Travel Editor",
      coverUrl: "https://images.unsplash.com/photo-1596395327369-0bca5a6e9a8c?w=800",
      readMinutes: 7,
      publishedAt: new Date("2026-01-07"),
    },
  ]).onConflictDoNothing().returning();

  console.log("✓ Seeded news posts");

  // === QUIZZES ===
  const [quiz1] = await db.insert(quizzesTable).values({
    code: "ORTH101",
    title: "Ethiopian Orthodox Basics",
    description: "Test your knowledge of Ethiopian Orthodox Church history, traditions, and beliefs.",
    category: "religion",
    difficulty: "easy",
    language: "en",
    timeLimitSeconds: 600,
    pointsTotal: 50,
    attemptsCount: 0,
    coverUrl: "https://images.unsplash.com/photo-1548625361-1d94651a28bf?w=400",
    authorName: "Church Education Dept",
    isPublic: true,
    status: "published",
    tags: ["orthodoxy", "ethiopia", "basics"],
  }).onConflictDoNothing().returning();

  const [quiz2] = await db.insert(quizzesTable).values({
    code: "SAINTS202",
    title: "Ethiopian Saints",
    description: "Learn about the lives and teachings of Ethiopian Orthodox saints.",
    category: "religion",
    difficulty: "medium",
    language: "en",
    timeLimitSeconds: 900,
    pointsTotal: 80,
    attemptsCount: 0,
    coverUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400",
    authorName: "Hagiography Society",
    isPublic: true,
    status: "published",
    tags: ["saints", "hagiography", "intermediate"],
  }).onConflictDoNothing().returning();

  console.log("✓ Seeded quizzes");

  // === QUIZ QUESTIONS ===
  if (quiz1) {
    await db.insert(quizQuestionsTable).values([
      {
        quizId: quiz1.id,
        type: "mcq",
        prompt: "What is the Ethiopian Orthodox Church called in Ge'ez?",
        options: [
          { id: "a", text: "Tewahedo" },
          { id: "b", text: "Coptic" },
          { id: "c", text: "Eastern Orthodox" },
          { id: "d", text: "Catholic" },
        ],
        correctAnswer: "a",
        explanation: "The Ethiopian Orthodox Church is called Tewahedo in Ge'ez, meaning 'unified' in reference to its Christology.",
        points: 10,
        position: 1,
      },
      {
        quizId: quiz1.id,
        type: "mcq",
        prompt: "Which emperor is credited with building the rock-hewn churches of Lalibela?",
        options: [
          { id: "a", text: "Emperor Menelik II" },
          { id: "b", text: "Emperor Haile Selassie" },
          { id: "c", text: "King Lalibela" },
          { id: "d", text: "Emperor Tewodros" },
        ],
        correctAnswer: "c",
        explanation: "King Lalibela (reigned 1181-1221) commissioned the construction of the 11 rock-hewn churches after receiving a divine vision.",
        points: 10,
        position: 2,
      },
      {
        quizId: quiz1.id,
        type: "mcq",
        prompt: "What is the holiest city in Ethiopian Orthodox Christianity?",
        options: [
          { id: "a", text: "Addis Ababa" },
          { id: "b", text: "Axum (Aksum)" },
          { id: "c", text: "Lalibela" },
          { id: "d", text: "Gondar" },
        ],
        correctAnswer: "b",
        explanation: "Axum is considered the holiest city as it houses the Church of Our Lady Mary of Zion, which tradition says contains the Ark of the Covenant.",
        points: 10,
        position: 3,
      },
      {
        quizId: quiz1.id,
        type: "truefalse",
        prompt: "The Ethiopian Orthodox Church follows the Julian calendar for religious holidays.",
        options: [],
        correctAnswer: "true",
        explanation: "Yes, the Ethiopian Orthodox Church uses the Julian calendar, which is why Ethiopian Christmas falls on January 7th (Gregorian).",
        points: 10,
        position: 4,
      },
      {
        quizId: quiz1.id,
        type: "mcq",
        prompt: "What is Timket?",
        options: [
          { id: "a", text: "Easter" },
          { id: "b", text: "Christmas" },
          { id: "c", text: "Epiphany" },
          { id: "d", text: "Pentecost" },
        ],
        correctAnswer: "c",
        explanation: "Timket celebrates the Epiphany - the baptism of Jesus Christ. It's one of the most important festivals in the Ethiopian Orthodox calendar.",
        points: 10,
        position: 5,
      },
    ]).onConflictDoNothing();
  }

  // Add questions for quiz2 (Saints quiz)
  if (quiz2) {
    await db.insert(quizQuestionsTable).values([
      {
        quizId: quiz2.id,
        type: "mcq",
        prompt: "Who founded the Debre Libanos Monastery?",
        options: [
          { id: "a", text: "Saint George" },
          { id: "b", text: "Saint Tekle Haymanot" },
          { id: "c", text: "Saint Michael" },
          { id: "d", text: "Abba Garima" },
        ],
        correctAnswer: "b",
        explanation: "Saint Tekle Haymanot founded Debre Libanos in the 13th century. He is one of Ethiopia's most revered saints.",
        points: 10,
        position: 1,
      },
      {
        quizId: quiz2.id,
        type: "mcq",
        prompt: "Which saint is credited with converting Ethiopia to Christianity?",
          options: [
          { id: "a", text: "Saint Frumentius" },
          { id: "b", text: "Saint George" },
          { id: "c", text: "Saint Mary" },
          { id: "d", text: "Saint Michael" },
        ],
        correctAnswer: "a",
        explanation: "Saint Frumentius (Abba Selama) was the first bishop of Ethiopia and is credited with establishing Christianity as the state religion.",
        points: 10,
        position: 2,
      },
      {
        quizId: quiz2.id,
        type: "mcq",
        prompt: "The monastery of Debre Damo was founded by which saint?",
        options: [
          { id: "a", text: "Abba Garima" },
          { id: "b", text: "Abune Aregawi" },
          { id: "c", text: "Saint Tekle Haymanot" },
          { id: "d", text: "Saint George" },
        ],
        correctAnswer: "b",
        explanation: "Abune Aregawi, one of the Nine Saints who came from the Byzantine Empire, founded Debre Damo in the 6th century.",
        points: 10,
        position: 3,
      },
    ]).onConflictDoNothing();
  }

  console.log("✓ Seeded quiz questions");

  // === QUIZ CHALLENGES ===
  if (quiz1) {
    await db.insert(quizChallengesTable).values([
      {
        title: "Weekly Faith Challenge",
        description: "Test your knowledge of Ethiopian Orthodox traditions and win a special badge!",
        type: "weekly",
        quizId: quiz1.id,
        prize: "Golden Cross Badge",
        bannerUrl: "https://images.unsplash.com/photo-1548625361-1d94651a28bf?w=800",
        startsAt: new Date("2026-01-01"),
        endsAt: new Date("2026-12-31"),
        status: "active",
      },
    ]).onConflictDoNothing();
  }
  console.log("✓ Seeded quiz challenges");

  // === SOCIAL FEATURES (only if we have users and content) ===
  if (user1 && destinations.length > 0 && mezmurs.length > 0 && newsPosts.length > 0) {
    const destId = String(destinations[0].id);
    const mezmurId = String(mezmurs[0].id);
    const newsId = String(newsPosts[0].id);

    // Bookmarks
    await db.insert(bookmarksTable).values([
      { userId: user1.id, targetType: "destination", targetId: destId },
      { userId: user1.id, targetType: "mezmur", targetId: mezmurId },
      { userId: user2.id, targetType: "destination", targetId: destId },
      { userId: user3.id, targetType: "news", targetId: newsId },
    ]).onConflictDoNothing();
    console.log("✓ Seeded bookmarks");

    // Comments
    const comments = await db.insert(commentsTable).values([
      {
        userId: user1.id,
        userName: user1.displayName || user1.name,
        userAvatarUrl: user1.avatarUrl || "",
        targetType: "destination",
        targetId: destId,
        body: "This is truly a spiritual wonder. I visited last year and was deeply moved by the devotion of the pilgrims.",
        likesCount: 3,
      },
      {
        userId: user2.id,
        userName: user2.displayName || user2.name,
        userAvatarUrl: user2.avatarUrl || "",
        targetType: "destination",
        targetId: destId,
        body: "Lalibela is breathtaking! The rock-hewn churches are even more impressive in person. Highly recommend visiting during Timket.",
        likesCount: 5,
      },
      {
        userId: user3.id,
        userName: user3.displayName || user3.name,
        userAvatarUrl: user3.avatarUrl || "",
        targetType: "mezmur",
        targetId: mezmurId,
        body: "This hymn brings me to tears every time. The choir's voices are heavenly.",
        likesCount: 2,
      },
    ]).onConflictDoNothing().returning();
    console.log("✓ Seeded comments");

    // Comment likes
    if (comments.length > 0) {
      await db.insert(commentLikesTable).values([
        { commentId: comments[0].id, userId: user2.id },
        { commentId: comments[0].id, userId: user3.id },
        { commentId: comments[1].id, userId: user1.id },
        { commentId: comments[1].id, userId: user3.id },
      ]).onConflictDoNothing();
      console.log("✓ Seeded comment likes");
    }

    // Reactions
    await db.insert(reactionsTable).values([
      { userId: user1.id, targetType: "destination", targetId: destId, kind: "heart" },
      { userId: user2.id, targetType: "destination", targetId: destId, kind: "pray" },
      { userId: user1.id, targetType: "news", targetId: newsId, kind: "cross" },
    ]).onConflictDoNothing();
    console.log("✓ Seeded reactions");

    // Streaks
    await db.insert(streaksTable).values([
      { userId: user1.id, currentStreak: 7, longestStreak: 14, totalPoints: 450, lastActiveDate: "2018-09-15" },
      { userId: user2.id, currentStreak: 3, longestStreak: 10, totalPoints: 280, lastActiveDate: "2018-09-14" },
      { userId: user3.id, currentStreak: 21, longestStreak: 45, totalPoints: 1250, lastActiveDate: "2018-09-15" },
      { userId: user4.id, currentStreak: 1, longestStreak: 5, totalPoints: 120, lastActiveDate: "2018-09-15" },
      { userId: user5.id, currentStreak: 5, longestStreak: 8, totalPoints: 320, lastActiveDate: "2018-09-13" },
    ]).onConflictDoNothing();
    console.log("✓ Seeded streaks");

    // User badges - lookup badge IDs by key
    const allBadges = await db.select().from(badgesTable);
    const badgeByKey = new Map<string, number>(
      allBadges.map((b: any) => [b.key, b.id]),
    );

    const userBadgeRows: any[] = [];
    const firstQuizId = badgeByKey.get("first_quiz");
    const scholarId = badgeByKey.get("scholar");
    const streak3Id = badgeByKey.get("streak_3");
    const streak7Id = badgeByKey.get("streak_7");
    const pilgrimId = badgeByKey.get("pilgrim");
    const hymnLoverId = badgeByKey.get("hymn_lover");
    const voiceChoirId = badgeByKey.get("voice_in_the_choir");
    const championId = badgeByKey.get("champion");

    if (firstQuizId) userBadgeRows.push({ userId: user1.id, badgeId: firstQuizId });
    if (streak7Id) userBadgeRows.push({ userId: user1.id, badgeId: streak7Id });
    if (voiceChoirId) userBadgeRows.push({ userId: user1.id, badgeId: voiceChoirId });
    if (firstQuizId) userBadgeRows.push({ userId: user2.id, badgeId: firstQuizId });
    if (pilgrimId) userBadgeRows.push({ userId: user2.id, badgeId: pilgrimId });
    if (streak3Id) userBadgeRows.push({ userId: user2.id, badgeId: streak3Id });
    if (scholarId) userBadgeRows.push({ userId: user3.id, badgeId: scholarId });
    if (championId) userBadgeRows.push({ userId: user3.id, badgeId: championId });
    if (hymnLoverId) userBadgeRows.push({ userId: user3.id, badgeId: hymnLoverId });
    if (streak7Id) userBadgeRows.push({ userId: user3.id, badgeId: streak7Id });

    if (userBadgeRows.length > 0) {
      await db.insert(userBadgesTable).values(userBadgeRows).onConflictDoNothing();
      console.log("✓ Seeded user badges");
    }

    // Notifications
    await db.insert(notificationsTable).values([
      {
        userId: user1.id,
        kind: "badge_awarded",
        title: "New Badge Earned!",
        body: "Congratulations! You've earned the 'First Steps' badge for completing your first quiz.",
        link: "/profile/badges",
        metadata: { badgeKey: "first_quiz" },
      },
      {
        userId: user1.id,
        kind: "comment_reply",
        title: "New Reply",
        body: "Sarah M. replied to your comment on Lalibela Rock-Hewn Churches",
        link: `/destinations/${destId}`,
      },
    ]).onConflictDoNothing();
    console.log("✓ Seeded notifications");
  }

  // === SYSTEM SETTINGS ===
  await db.insert(systemSettingsTable).values([
    {
      key: "site.name",
      value: "Guzo - Orthodox Traveler Hub",
      description: "The name of the application displayed in the UI",
    },
    {
      key: "features.marketplace.enabled",
      value: true,
      description: "Enable or disable the marketplace feature",
    },
    {
      key: "features.quizzes.enabled",
      value: true,
      description: "Enable or disable the quiz/learning feature",
    },
    {
      key: "maintenance.mode",
      value: false,
      description: "When enabled, shows maintenance page to non-admin users",
    },
  ]).onConflictDoNothing();
  console.log("✓ Seeded system settings");

  // === AUDIT LOGS ===
  await db.insert(auditLogTable).values([
    {
      actorEmail: "admin@guzo.app",
      actorRole: "superadmin",
      action: "user.create",
      targetType: "user",
      targetId: "1",
      metadata: { note: "Initial admin user creation" },
      ip: "127.0.0.1",
    },
    {
      actorEmail: "admin@guzo.app",
      actorRole: "superadmin",
      action: "destination.create",
      targetType: "destination",
      targetId: "1",
      metadata: { destinationName: "Lalibela Rock-Hewn Churches" },
      ip: "127.0.0.1",
    },
  ]).onConflictDoNothing();
  console.log("✓ Seeded audit logs");

  console.log("✓ All examples seeded successfully!");
}
