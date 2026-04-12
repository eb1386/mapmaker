import { supabase } from './supabase'
import type { Location } from './types/database'

// fallback data
const FALLBACK: Location[] = [
  {
    id: 'stanley-park',
    name: 'Stanley Park Bike Loop',
    coords: [-123.1443, 49.3017],
    photos: ['img/stanley-1.jpeg', 'img/stanley-2.jpeg', 'img/dimsum-1.jpeg', 'img/dimsum-2.jpeg'],
    fits: ['contain', 'cover', 'cover', 'cover'],
    audio: 'audio/stanley.mp3',
    citation: 'Swedish House Mafia. (2012). Don\'t you worry child [Song; radio edit]. Astralwerks.',
    body: 'When the sun is shining and I want to clear my mind, biking around Stanley Park is one of my favourite physical self-care activities. Exercise releases endorphins like dopamine and serotonin, which boost my mood and help me relax. These endorphins also benefit brain health, which works great for finals season. Sometimes I go with my friends and family, which makes it a fun social activity too. This term I went on many bike rides, and I included one of them from last week (spot the Stanley Park loop).',
    sort_order: 0,
    created_at: ''
  },
  {
    id: 'lucky-fortune',
    name: 'Dim Sum Weekends',
    coords: [-123.1395, 49.2106],
    photos: ['img/dimsum-3.jpeg', 'img/dimsum-4.jpeg', 'img/dimsum-5.jpeg'],
    fits: [],
    audio: 'audio/dimsum.mp3',
    citation: 'The Sundays. (1997). Summertime [Song]. On Static & silence. Geffen Records.',
    body: 'Going out for dim sum is an important way I take care of my emotional well-being. Sharing food creates a sense of comfort, connection, and happiness. My personal favourites are har gow, beef cheung fun, Portuguese rice, and of course the tea. During the term I made time to go for dim sum with my family, which helped me feel more balanced and supported. While food itself can bring me joy, especially rain or shine ice cream, enjoying it over many hours with the people I love makes it so much better.',
    sort_order: 1,
    created_at: ''
  },
  {
    id: 'kerrisdale',
    name: 'Kerrisdale',
    coords: [-123.1556, 49.235],
    photos: ['img/kerrisdale-1.jpeg', 'img/kerrisdale-2.jpeg'],
    fits: [],
    audio: 'audio/kerrisdale.mp3',
    citation: 'The Police. (1983). Every breath you take [Song]. On Synchronicity. A&M Records.',
    body: 'Spending time in Kerrisdale with my friends is a key part of my relational self-care. It helps strengthen my friendships and gives me a sense of belonging. Some of our go-to activities include getting acai bowls at Honolulu Coffee, walking around the Hills store, trying the mattresses at Sleep Country, eating sushi at Asa Sushi, and smelling the perfumes at Shoppers Drug Mart. While I do sometimes lose track of time, the social connections greatly reduce my stress. Just like exercising, socializing can release endorphins. This term I visited Kerrisdale on many Saturday afternoons, exploring more shops and trying new bubble tea stores.',
    sort_order: 2,
    created_at: ''
  },
  {
    id: 'pacific-spirit-park',
    name: 'Pacific Spirit Park Walks',
    coords: [-123.2089, 49.2561],
    photos: ['img/park-1.jpeg', 'img/park-2.jpeg'],
    fits: [],
    audio: 'audio/park.mp3',
    citation: 'Kahan, N. (2022). All my love [Song]. On Stick season. Republic Records.',
    body: 'Walking through Pacific Spirit Park allows me to slow down and reflect, supporting my spiritual well-being. Being surrounded by nature helps me feel calm, grounded, and more connected to the world around me. The large moss-covered trees, fresh air, and local wildlife are an amazing escape from university and city life. It gives me time to think, clear my mind, and reset. This term I went on many walks in Pacific Spirit Park, which helped me feel more peaceful and focused. Sometimes I would incorporate exercise (running) and socializing (going with friends). One of my favourite things is also to take my dog, my best friend.',
    sort_order: 3,
    created_at: ''
  }
]

export async function fetchLocations(): Promise<Location[]> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    if (data && data.length > 0) return data as Location[]
  } catch (err) {
    console.warn('supabase fetch failed, using fallback:', err)
  }
  return FALLBACK
}
