// Deterministic demo data. No faker: a seeded PRNG and hand-written templates.
//   node scripts/seed.ts            seed an empty database
// Every account's password is `halo-demo`. Sign in as @demo.
import { createSql, type Sql } from '../src/server/sql.ts'
import { hashPassword } from '../src/server/auth/password.ts'
import { createPost, setLike, setRepost } from '../src/features/posts/server/repo.ts'

let state = 0x2f6b3a1d
const rand = () => ((state = (Math.imul(state ^ (state >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0) / 2 ** 32)
const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]!
const chance = (p: number) => rand() < p

const PEOPLE = [
  ['demo', 'Demo Account', 'Kicking the tyres on Halo. Everything here is seed data.'],
  ['ada', 'Ada Lovelace', 'First programmer. Poetical science enthusiast.'],
  ['grace', 'Grace Hopper', 'It’s easier to ask forgiveness than it is to get permission.'],
  ['linus', 'Linus T.', 'Talk is cheap. Show me the code.'],
  ['margaret', 'Margaret Hamilton', 'Software engineering, before it had a name.'],
  ['dennis', 'Dennis R.', 'UNIX is basically a simple operating system.'],
  ['barbara', 'Barbara Liskov', 'Substitutability or bust.'],
  ['alan', 'Alan Kay', 'The best way to predict the future is to invent it.'],
  ['sophie', 'Sophie Wilson', 'Designed an instruction set on a napkin once.'],
  ['ken', 'Ken T.', 'When in doubt, use brute force.'],
  ['hedy', 'Hedy Lamarr', 'Frequency hopping, film sets, and inventing things.'],
  ['katherine', 'Katherine Johnson', 'Like what you do, and then you will do your best.'],
  ['tim', 'Tim B-L', 'This is for everyone.'],
  ['radia', 'Radia Perlman', 'Mother of the spanning tree. Networks are poetry.'],
  ['frances', 'Frances Allen', 'Compilers make the world go round.'],
  ['john', 'John Carmack', 'Focused, hard work is the real key to success.'],
  ['mina', 'Mina Park', 'Product designer in Seoul. Typography nerd. 🇰🇷'],
  ['jiho', 'Jiho Kim', 'Frontend @ a startup you haven’t heard of yet.'],
  ['sora', 'Sora Lee', 'Music, synths and late-night coding.'],
  ['yuna', 'Yuna Choi', 'Data viz and coffee. Mostly coffee.'],
  ['noah', 'Noah Becker', 'Building dev tools. Opinions are my own.'],
  ['lena', 'Lena Novak', 'Accessibility advocate. Semantic HTML is a love language.'],
  ['omar', 'Omar Haddad', 'Distributed systems and distributed coffee cups.'],
  ['priya', 'Priya Nair', 'ML engineer. Currently fighting a GPU.'],
  ['diego', 'Diego Alvarez', 'Indie hacker. Shipping in public.'],
  ['emma', 'Emma Laurent', 'Design systems at scale. Tokens all the way down.'],
  ['kai', 'Kai Nakamura', 'Motion designer who learned CSS out of spite.'],
  ['zara', 'Zara Okafor', 'Security engineer. Please rotate your keys.'],
  ['felix', 'Felix Wagner', 'Rustacean by day, pianist by night.'],
  ['ines', 'Inês Costa', 'Product manager. Asking “why” professionally.'],
  ['arjun', 'Arjun Mehta', 'Postgres is the answer. What was the question?'],
  ['hana', 'Hana Sato', 'Illustrator. Drawing the internet one pixel at a time.'],
  ['leo', 'Leo Rossi', 'Photographer & weekend React dev.'],
  ['maya', 'Maya Cohen', 'Staff engineer. Writes docs nobody reads (you should).'],
  ['theo', 'Theo Martin', 'Audio engineer turned web engineer.'],
  ['nina', 'Nina Petrova', 'Chess, climbing and compilers.'],
  ['ravi', 'Ravi Shankar', 'Open source maintainer. Please read the contributing guide.'],
  ['elin', 'Elin Berg', 'Nordic minimalism, in UI and in life.'],
  ['sam', 'Sam Rivera', 'Community at a dev tools company. DMs open.'],
  ['halo', 'Halo', 'The official account. Built with Heliostack.'],
] as const

const TAGS = ['nextjs', 'react', 'webdev', 'css', 'postgres', 'design', 'ai', 'typescript', 'music', 'opensource', 'buildinpublic', 'a11y', '서울', 'heliostack']
const OPENERS = ['Hot take:', 'TIL', 'Reminder:', 'Unpopular opinion:', 'Shipped!', 'Thread:', 'Quick one:', 'Honestly,', 'PSA:', 'Small win today:']
const BODIES = [
  'server components finally clicked for me once I stopped thinking of them as "SSR".',
  'the native <dialog> element handles focus trapping better than most libraries I have used.',
  'most performance problems are data fetching problems wearing a trench coat.',
  'you probably don’t need that state management library. URL + server state covers a lot.',
  'CSS anchor positioning just deleted 400 lines of tooltip code from our app.',
  'writing the migration first and the UI last has made our team so much faster.',
  'a design system is a set of decisions, not a set of components.',
  'if your cache has no invalidation story, it is not a cache, it is a bug farm.',
  'Postgres full text search is criminally underrated for small and medium apps.',
  'naming things is still the hardest part. Today’s victim: a feature flag.',
  'coffee count: 3. bugs fixed: 1. bugs created: 2. net progress: vibes.',
  'reviewed a PR where the AI wrote the tests first. Honestly it was great.',
  'content-visibility: auto made our feed scroll like butter. No virtualization needed.',
  'the best accessibility fix is almost always "use the right HTML element".',
  'optimistic UI is a UX feature, rollback handling is the engineering feature.',
  'every dependency is a liability you signed up to maintain forever.',
  'streaming + Suspense means the slow part of the page no longer holds the fast part hostage.',
  'OKLCH makes building colour palettes feel like cheating.',
  'shipping small things every day beats shipping big things every quarter.',
  'I love when the database enforces the invariant so the app code doesn’t have to.',
  'new synth arrived. productivity will be low this week.',
  'Seoul in autumn is unreasonably beautiful.',
  'finally moved our realtime updates to SSE. Simpler than websockets for 90% of cases.',
  'typed routes caught three broken links before they hit production today.',
]
const REPLIES = [
  'This is so true.', 'Strong agree.', 'Counterpoint: it depends 😅', 'Saving this for later.', 'Could you share an example?',
  'We did the same and never looked back.', 'Wait, since when?!', 'This deserves more attention.', 'Hard disagree, but respect.',
  'Came here to say exactly this.', 'Adding this to our team docs.', 'The trench coat line got me.', '100%. Measure first.',
]
const MESSAGES = [
  'Hey! Loved your post earlier.', 'Are you going to the meetup next week?', 'Thanks for the review 🙏', 'Can you send me the link?',
  'Haha exactly', 'Let’s pair on it tomorrow?', 'Sounds good!', 'I’ll ship it tonight.', 'Did you see the new release?', 'Coffee later?',
]

async function seed(sql: Sql) {
  const [row] = await sql<{ n: number }[]>`select count(*)::int as n from users`
  const n = row?.n ?? 0
  if (n > 0) {
    console.log(`database already has ${n} users — run "pnpm db:reset" to reseed`)
    return
  }
  const passwordHash = await hashPassword('halo-demo')
  const users = await sql<{ id: string; handle: string }[]>`
    insert into users ${sql(
      PEOPLE.map(([handle, displayName, bio], i) => ({
        handle, displayName, bio, email: `${handle}@halo.dev`, passwordHash,
        avatarHue: Math.floor(rand() * 360), verified: i === 0 || i % 7 === 1 || handle === 'halo',
        location: pick(['Seoul', 'Berlin', 'Lisbon', 'San Francisco', 'Tokyo', 'London', 'Remote', '']),
        website: chance(0.3) ? `https://${handle}.dev` : '',
      })),
    )}
    returning id, handle`
  const byHandle = new Map(users.map((u) => [u.handle, u.id]))
  const ids = users.map((u) => u.id)

  // Follow graph: power-law-ish — early accounts are more popular.
  const follows: { followerId: string; followeeId: string }[] = []
  for (const follower of ids) {
    for (const [i, followee] of ids.entries()) {
      if (follower !== followee && chance(0.55 / (1 + i * 0.08))) follows.push({ followerId: follower, followeeId: followee })
    }
  }
  const demo = byHandle.get('demo')!
  for (const h of ['ada', 'grace', 'mina', 'jiho', 'lena', 'arjun', 'emma', 'halo']) {
    const followeeId = byHandle.get(h)!
    if (!follows.some((f) => f.followerId === demo && f.followeeId === followeeId)) follows.push({ followerId: demo, followeeId })
  }
  await sql`insert into follows ${sql(follows)} on conflict do nothing`

  // Posts spread over the last 10 days, oldest first so ids increase with time.
  const posts: { id: string; authorId: string }[] = []
  const now = Date.now()
  const total = 420
  for (let i = 0; i < total; i++) {
    const authorId = pick(ids)
    const at = new Date(now - (total - i) * (10 * 86_400_000) / total - rand() * 600_000)
    const isReply = posts.length > 10 && chance(0.3)
    const tag = chance(0.45) ? ` #${pick(TAGS)}` : ''
    const mention = chance(0.12) ? ` cc @${pick(PEOPLE)[0]}` : ''
    const body = isReply ? pick(REPLIES) : `${chance(0.5) ? pick(OPENERS) + ' ' : ''}${pick(BODIES)}${tag}${mention}`
    const parent = isReply ? pick(posts.slice(-60)) : undefined
    const quote = !isReply && posts.length > 20 && chance(0.06) ? pick(posts) : undefined
    const created = await createPost(sql, authorId, { body, replyToId: parent?.id, quoteOfId: quote?.id })
    if (created === 'parent_missing') continue
    await sql`update posts set created_at = ${at} where id = ${created.id}`
    await sql`update post_hashtags set created_at = ${at} where post_id = ${created.id}`
    posts.push({ id: created.id, authorId })
  }

  // Engagement, weighted towards recent posts.
  for (const [i, post] of posts.entries()) {
    const heat = (i / posts.length) ** 2
    for (const userId of ids) {
      if (userId !== post.authorId && chance(0.02 + heat * 0.18)) await setLike(sql, userId, post.id, true)
      if (userId !== post.authorId && chance(0.004 + heat * 0.03)) await setRepost(sql, userId, post.id, true)
    }
  }
  await sql`update notifications set read_at = now() where created_at < now() - interval '1 day'`

  // A few DM conversations with the demo account.
  for (const handle of ['ada', 'mina', 'arjun', 'sam', 'jiho']) {
    const other = byHandle.get(handle)!
    const [low, high] = [demo, other].sort((a, b) => Number(a) - Number(b))
    const [conv] = await sql<{ id: string }[]>`insert into conversations (dm_key) values (${`${low}:${high}`}) returning id::text`
    await sql`insert into conversation_members ${sql([{ conversationId: conv!.id, userId: demo }, { conversationId: conv!.id, userId: other }])}`
    const count = 3 + Math.floor(rand() * 6)
    for (let m = 0; m < count; m++) {
      const at = new Date(now - (count - m) * 2_700_000 - Math.floor(rand() * 600_000)) // monotonic: ids and times agree
      await sql`insert into messages (conversation_id, sender_id, body, created_at) values (${conv!.id}, ${chance(0.5) ? demo : other}, ${pick(MESSAGES)}, ${at})`
    }
    await sql`update conversations set last_message_at = (select max(created_at) from messages where conversation_id = ${conv!.id}) where id = ${conv!.id}`
    await sql`update conversation_members set last_read_at = now() - interval '2 hours' where conversation_id = ${conv!.id}`
  }

  const [stats] = await sql`select (select count(*) from users)::int as users, (select count(*) from posts)::int as posts,
    (select count(*) from likes)::int as likes, (select count(*) from follows)::int as follows`
  console.log('seeded', stats)
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = createSql(url, { max: 1 })
  await seed(sql)
  await sql.end()
}
