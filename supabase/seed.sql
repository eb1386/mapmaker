-- seed locations
insert into public.locations (id, name, coords, photos, fits, audio, citation, body, sort_order) values
(
  'stanley-park',
  'Stanley Park Bike Loop',
  ARRAY[-123.1443, 49.3017],
  ARRAY['img/stanley-1.jpeg', 'img/stanley-2.jpeg', 'img/dimsum-1.jpeg', 'img/dimsum-2.jpeg'],
  ARRAY['contain', 'cover', 'cover', 'cover'],
  'audio/stanley.mp3',
  'Swedish House Mafia. (2012). Don''t you worry child [Song; radio edit]. Astralwerks.',
  'When the sun is shining and I want to clear my mind, biking around Stanley Park is one of my favourite physical self-care activities. Exercise releases endorphins like dopamine and serotonin, which boost my mood and help me relax. These endorphins also benefit brain health, which works great for finals season. Sometimes I go with my friends and family, which makes it a fun social activity too. This term I went on many bike rides, and I included one of them from last week (spot the Stanley Park loop).',
  0
),
(
  'lucky-fortune',
  'Dim Sum Weekends',
  ARRAY[-123.1395, 49.2106],
  ARRAY['img/dimsum-3.jpeg', 'img/dimsum-4.jpeg', 'img/dimsum-5.jpeg'],
  ARRAY[]::text[],
  'audio/dimsum.mp3',
  'The Sundays. (1997). Summertime [Song]. On Static & silence. Geffen Records.',
  'Going out for dim sum is an important way I take care of my emotional well-being. Sharing food creates a sense of comfort, connection, and happiness. My personal favourites are har gow, beef cheung fun, Portuguese rice, and of course the tea. During the term I made time to go for dim sum with my family, which helped me feel more balanced and supported. While food itself can bring me joy, especially rain or shine ice cream, enjoying it over many hours with the people I love makes it so much better.',
  1
),
(
  'kerrisdale',
  'Kerrisdale',
  ARRAY[-123.1556, 49.235],
  ARRAY['img/kerrisdale-1.jpeg', 'img/kerrisdale-2.jpeg'],
  ARRAY[]::text[],
  'audio/kerrisdale.mp3',
  'The Police. (1983). Every breath you take [Song]. On Synchronicity. A&M Records.',
  'Spending time in Kerrisdale with my friends is a key part of my relational self-care. It helps strengthen my friendships and gives me a sense of belonging. Some of our go-to activities include getting acai bowls at Honolulu Coffee, walking around the Hills store, trying the mattresses at Sleep Country, eating sushi at Asa Sushi, and smelling the perfumes at Shoppers Drug Mart. While I do sometimes lose track of time, the social connections greatly reduce my stress. Just like exercising, socializing can release endorphins. This term I visited Kerrisdale on many Saturday afternoons, exploring more shops and trying new bubble tea stores.',
  2
),
(
  'pacific-spirit-park',
  'Pacific Spirit Park Walks',
  ARRAY[-123.2089, 49.2561],
  ARRAY['img/park-1.jpeg', 'img/park-2.jpeg'],
  ARRAY[]::text[],
  'audio/park.mp3',
  'Kahan, N. (2022). All my love [Song]. On Stick season. Republic Records.',
  'Walking through Pacific Spirit Park allows me to slow down and reflect, supporting my spiritual well-being. Being surrounded by nature helps me feel calm, grounded, and more connected to the world around me. The large moss-covered trees, fresh air, and local wildlife are an amazing escape from university and city life. It gives me time to think, clear my mind, and reset. This term I went on many walks in Pacific Spirit Park, which helped me feel more peaceful and focused. Sometimes I would incorporate exercise (running) and socializing (going with friends). One of my favourite things is also to take my dog, my best friend.',
  3
)
on conflict (id) do update set
  name = excluded.name,
  coords = excluded.coords,
  photos = excluded.photos,
  fits = excluded.fits,
  audio = excluded.audio,
  citation = excluded.citation,
  body = excluded.body,
  sort_order = excluded.sort_order;
