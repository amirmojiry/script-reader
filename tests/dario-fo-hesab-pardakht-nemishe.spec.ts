import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'
import {
  HESAB_PARDAKHT_NEMISHE_BUNDLED_ID,
  hesabPardakhtNemishePlay,
  hesabPardakhtNemisheSource
} from '../src/data/darioFo'
import type { DialogueBlock } from '../src/types'
import { dialogueCharacterIds, dialogueText, flattenBlocks, validatePlay } from '../src/utils/play'

describe('حساب پرداخت نمی‌شه! bundled play', () => {
  it('preserves the supplied two-act source in canonical order', () => {
    const blocks = flattenBlocks(hesabPardakhtNemishePlay)

    expect(hesabPardakhtNemisheSource.acts.map((act) => act.records.length)).toEqual([479, 535])
    expect(hesabPardakhtNemishePlay.acts).toHaveLength(2)
    expect(hesabPardakhtNemishePlay.characters).toHaveLength(9)
    expect(blocks).toHaveLength(1014)
    expect(blocks.filter((block) => block.type === 'dialogue')).toHaveLength(989)
    expect(blocks.filter((block) => block.type === 'stage-direction')).toHaveLength(25)
    expect(hesabPardakhtNemishePlay.characters.map((character) => character.name)).toEqual([
      'آنتونیا',
      'جووانی',
      'مارگریتا',
      'لوئیجی',
      'پاسبان',
      'ژاندارم',
      'پیرمرد',
      'گورکن',
      'ماموران پلیس'
    ])
    expect(validatePlay(hesabPardakhtNemishePlay)).toEqual({ valid: true, errors: [] })

    let absoluteIndex = 0
    hesabPardakhtNemisheSource.acts.forEach((act, actIndex) => {
      const canonicalBlocks = hesabPardakhtNemishePlay.acts[actIndex].scenes[0].blocks
      expect(canonicalBlocks).toHaveLength(act.records.length)

      act.records.forEach((record, recordIndex) => {
        const block = canonicalBlocks[recordIndex]
        expect(block.id).toBe(`a${actIndex + 1}-b${String(recordIndex + 1).padStart(4, '0')}`)
        expect(blocks[absoluteIndex]).toEqual(block)

        if (record[0] === 's') {
          expect(block).toEqual({ id: block.id, type: 'stage-direction', text: record[1] })
        } else {
          expect(block.type).toBe('dialogue')
          const dialogue = block as DialogueBlock
          const expectedNames = Array.isArray(record[1]) ? record[1] : [record[1]]
          const actualNames = dialogueCharacterIds(dialogue).map((id) =>
            hesabPardakhtNemishePlay.characters.find((character) => character.id === id)?.name
          )
          expect(actualNames).toEqual(expectedNames)
          expect(dialogue.parts).toEqual([{ type: 'speech', text: record[2] }])
          expect(dialogueText(dialogue)).toBe(record[2])
        }

        absoluteIndex += 1
      })
    })

    expect(blocks[478]?.id).toBe('a1-b0479')
    expect(blocks[479]?.id).toBe('a2-b0001')
    expect(blocks.at(-1)).toEqual({
      id: 'a2-b0535',
      type: 'stage-direction',
      text: '(با بیان آخرین جمله صحنه کم‌کم تاریک می‌شود.)'
    })
  })

  it('keeps page-break speech with its speaker and excludes scan artifacts', () => {
    const blocks = flattenBlocks(hesabPardakhtNemishePlay)
    const dialogueTexts = blocks
      .filter((block): block is DialogueBlock => block.type === 'dialogue')
      .map((block) => dialogueText(block))
      .join('\n')
    const stageTexts = blocks
      .filter((block) => block.type === 'stage-direction')
      .map((block) => block.text)
      .join('\n')

    expect(dialogueTexts).toContain('خانه‌ی پسر خانم رزا را تفتیش کردند')
    expect(dialogueTexts).toContain('اطلاعات بیش‌تری در مورد این دو راننده کامیون ندارید؟')
    expect(dialogueTexts).toContain('همیشه مرده‌ها را توی کمد جای می‌دهند')
    expect(dialogueTexts).toContain('همبستگی چه می‌شد؟')
    expect(dialogueTexts).toContain('خواب دیدی! قبول کن!')
    expect(dialogueTexts).toContain('تنفس مصنوعی.')
    expect(dialogueTexts).toContain('ننه‌جان دستم به دامنت!')
    const jointBlock = blocks.find((block) => block.type === 'dialogue' && dialogueText(block).startsWith('ننه‌جان دستم به دامنت!'))
    expect(jointBlock?.type).toBe('dialogue')
    if (jointBlock?.type === 'dialogue') {
      expect(dialogueCharacterIds(jointBlock)).toEqual(['giovanni', 'luigi'])
    }
    expect(dialogueTexts).toContain('اویلالیای مقدس با شکم برآمده')
    expect(dialogueTexts).toContain('قاتل‌ها! خوک‌ها! لعنتی‌ها!')
    expect(dialogueTexts).toContain('شما رفتار اعتماد‌برانگیزی دارید. همین‌جا زندگی می‌کنید؟')
    expect(dialogueTexts).not.toContain('قطار را متوقف کردند.\nهذیان نگو')
    expect(dialogueTexts + stageTexts).not.toMatch(/(^|[^\u0600-\u06FF])اچرا([^\u0600-\u06FF]|$)/)
    expect(dialogueTexts).toContain('زن تو کاملا سالم است و کماکان می‌تواند بچه‌دار بشود')
    expect(dialogueTexts).toContain('امروز هم واقعاً مثل روز مادر است')
    expect(stageTexts).not.toContain('خانه‌ی پسر خانم رزا را تفتیش کردند')
    expect(dialogueTexts + stageTexts).not.toContain('کِصِ77 ۱۸۵۱')
    expect(dialogueTexts + stageTexts).not.toContain('۲ لمع 1')
    expect(dialogueTexts + stageTexts).not.toMatch(/(^|\n)ساب پرداخت نمی‌شه($|\n)/)
    expect(dialogueTexts + stageTexts).not.toContain('۹ص مع «ا')
    expect(dialogueTexts + stageTexts).not.toContain('کفت‌وکو')
    expect(dialogueTexts + stageTexts).not.toContain('ایسن')
    expect(dialogueTexts + stageTexts).not.toContain('جسووانی')
    expect(dialogueTexts + stageTexts).not.toContain('دار یو فو')
    expect(dialogueTexts + stageTexts).not.toContain('داربو فو')
    expect(dialogueTexts + stageTexts).not.toContain('سیصٍث')
    expect(dialogueTexts + stageTexts).not.toContain('|')
    expect(dialogueTexts + stageTexts).not.toContain('آن‌وقت آنوقت')
    expect(dialogueTexts + stageTexts).not.toMatch(/تولید کرده نا|نمی‌دهسیم|ولبی|یبک‌دیگر|(?:^|\s)وب گوش کن/)
    expect(dialogueTexts + stageTexts).not.toMatch(/آ»|بُزییاری|کش‌رفتماه|نو می‌خواستی|ریل راء‌آهن|طلب‌هاا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/بودندا|کردندا|باشیدا|نکنندا|نشده بودا|تلقین بودا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/بتو!نید|نور!نی|می‌تو!نستم/)
    expect(dialogueTexts + stageTexts).not.toMatch(/می‌شودا|اگسر|نمی‌فهمندا|فکر می‌کنناد|می‌کردیدا|می‌روندا|نمی‌کشدا|می‌اندازدا|می‌رسیدا|ماچرا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/(?:^|\s)۱(?:\s|$|[؟?!.,،])/)
    expect(dialogueTexts + stageTexts).not.toMatch(/بببیرون|ببیرون|اشتباههه|واقعاًً|اینن|یبن|بیاء|مار گریتا|سپیل|مقاببل|می‌کن،د|می‌تو!نیم|بتو!نم/)
    expect(dialogueTexts + stageTexts).not.toMatch(/صدا البته|مردانه باشدا|دستو رات|تقتیش/)
    expect(dialogueTexts + stageTexts).not.toMatch(/مسسه|حدافل|منامن|فانون|مواطب/)
    expect(dialogueTexts + stageTexts).not.toMatch(/راهتان را بشید|می‌ایم|یاباید|یااداره|کلاه‌بر دارها|شلوغ کننا|شوخی کردا|رفت\.\. ,/)
    expect(dialogueTexts).toContain('راست گفتی، مقداری پول به من بده.')
    expect(dialogueTexts + stageTexts).not.toMatch(/پول به م[,،]/)
    expect(dialogueTexts + stageTexts).not.toContain('قرص ار نکرده')
    expect(dialogueTexts + stageTexts).not.toMatch(/بار نمی‌کنشد|وکارشان|گذر کننداه|ارتتش|سرنگاه|ماسیده‌هاا|داشته باشده/)
    expect(dialogueTexts).toContain('مامباتی و فوسانی را دستگیر کردند')
    expect(dialogueTexts + stageTexts).not.toMatch(/مامباتی\s*"|فوسانی\s*"/)
    expect(dialogueTexts + stageTexts).not.toMatch(/می‌شماردا|ببینیدا|فرزند شدا|ببندا سریم|نخیرا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/فکر کنیمی|بچه نیاوریا|خدا را شکرا|شکرا یعنی|سلام\. پدرا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/از سک هم بدتریم|می‌کذارد|بعد همم|لوئیجی وجووانی/)
    expect(dialogueTexts + stageTexts).not.toMatch(/گرماو رطوبتی|۳۰۰ نفر شاغل»/)
    expect(dialogueTexts + stageTexts).not.toMatch(/([\u064B-\u0652\u0670])\1/u)
    for (const block of blocks) {
      const text = block.type === 'dialogue'
        ? dialogueText(block)
        : block.type === 'stage-direction'
          ? block.text
          : block.title
      expect((text.match(/«/g) ?? []).length).toBe((text.match(/»/g) ?? []).length)
      expect((text.match(/\(/g) ?? []).length).toBe((text.match(/\)/g) ?? []).length)
      expect(text).not.toMatch(/([\u0621-\u06FF])\1{2,}/u)
    }
    expect(dialogueTexts + stageTexts).not.toMatch(/سسوی|دررا|ومی‌گویید|موادغذایی|بااحتیاط|دونفر/)
    expect(dialogueTexts + stageTexts).not.toMatch(/ابداء|بازیکر|شماء|کلا‌بردار|این‌پا و آنپا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/عاقبست|ماچه|ماهم|(?:^|\s)مارا(?:\s|$)|شمارا|آن‌هارا|نله|زیرفیمت|نقمش|خودش را نقمش/m)
    expect(dialogueTexts + stageTexts).not.toMatch(/تو جی\?|بادیدن|برسود|(?:^|\s)هنه[,،.]|ماک‌ارونی|لعیم|گردشی تفریحی به کلی بیمارستان/m)
    expect(dialogueTexts + stageTexts).not.toMatch(/رابرایش|آنیکی‌ها|برق وگاز|کله‌موکتی‌ها|اعتصاب کنندگان/m)
    expect(dialogueTexts).toContain('با این کله‌پوک‌ها و تن‌لش‌ها همراه شوی؟ اعتصاب‌کنندگان رذل!')
    expect(dialogueTexts).toContain('اعتصاب‌کنندگان رذل؟ اوهو!')
    expect(dialogueTexts).toContain('توی آن یکی‌ها آرد سیاه')
    expect(dialogueTexts).toContain('تو باید همه چیز را برایش توضیح بدهی!')
    expect(dialogueTexts).toContain('برق و گاز را پرداخت کردی؟')
    expect(dialogueTexts).toContain('بله. برق و گاز را پرداخته‌ام.')
    expect(dialogueTexts).toContain('گردشی تفریحی به تمام بیمارستان‌های شهر بزنیم و او توی ماشین از دست برود!')
    expect(dialogueTexts).toContain('تو چی؟ کارفرمایی که باید بلیط ماهانه قطار ما را پرداخت کند.')
    expect(dialogueTexts).toContain('چون با کار کردن عصبی می‌شویم با دیدن فیلم اعصاب‌مان آرام می‌گیرد.')
    expect(dialogueTexts).toContain('چون ما صاحب اولاد می‌شویم و بر سود او می‌افزاییم!')
    expect(dialogueTexts).toContain('نه، نه. به شما نمی‌شود اعتماد کرد آقای مدیر عزیزم.')
    expect(dialogueTexts).toContain('به‌جای بچه در شکمش ماکارونی و از این جور چیزها دارد.')
    expect(dialogueTexts).toContain('لعنت بر شیطان لعین!')
    expect(dialogueTexts).not.toMatch(/(?:از|به|با|برای|که|و|یا|اگر|اما|ولی|تا)\s+\([^()]*\)(?:\n|$)/mu)
    expect(dialogueTexts + stageTexts).not.toMatch(/[!؟]\s*:\s*|»\s*:/u)
    expect(dialogueTexts).toContain('ببین که واحدهای مستقل چقدر از هم جدا هستند...')
    expect(dialogueTexts).not.toContain('واحدهای مستقل چقدر از (')
    expect(dialogueTexts).toContain('کلاه‌بردارند!» و تو آن‌همه ترسیدی...')
    expect(dialogueTexts).not.toContain('به پرستارها اعتماد کرد؟»')
    const nonParenthesizedStageTexts = blocks.flatMap((block) =>
      block.type === 'stage-direction' && !block.text.trim().startsWith('(') ? [block.text] : []
    )
    expect(nonParenthesizedStageTexts).toHaveLength(1)
    expect(nonParenthesizedStageTexts[0]).toMatch(/^خانه‌ی یک خانواده‌ی کارگری/)
    expect(dialogueTexts + stageTexts).not.toMatch(/تمام مردم وقتی مرا می‌بینند\. چنین می‌کند|ژاندارم را مثل عروسک جابه‌جا می‌کند|در کمد را باز می‌کند و متوجه ژاندارم|هندی‌ها وقتی غذایی برای خوردن ندارند\.\.\. از روی شوق یوگا کار می‌کند|آن‌ها به یک تلقین بسنده می‌کند|خانه‌ها را تخلیه می‌کند|چند نفری هم که پرداخت می‌کند/)
    expect(dialogueTexts).toContain('تمام مردم وقتی مرا می‌بینند. چنین می‌کنند')
    expect(dialogueTexts).toContain('ژاندارم را مثل عروسک جابه‌جا می‌کنند')
    expect(dialogueTexts).toContain('در کمد را باز می‌کنند و متوجه ژاندارم نمی‌شوند')
    expect(dialogueTexts).toContain('هندی‌ها وقتی غذایی برای خوردن ندارند... از روی شوق یوگا کار می‌کنند')
    expect(dialogueTexts).toContain('آن‌ها به یک تلقین بسنده می‌کنند؟')
    expect(dialogueTexts).toContain('آن‌ها تقریبا همه‌ی خانه‌ها را تخلیه می‌کنند')
    expect(dialogueTexts).toContain('آن چند نفری هم که پرداخت می‌کنند')
    expect(dialogueTexts).toContain('حالا می‌بینی آخر و عاقبت ما چه می‌شود.')
    expect(dialogueTexts).toContain('بله همان که مسئول خدمت بود.')
    expect(dialogueTexts).toContain('جنسی را زیر قیمت بخری')
    expect(dialogueTexts).toContain('نذرش را به‌جای می‌آورد.')
    expect(dialogueTexts).toContain('نمی‌دانستم تمام این وسائل را چطوری حمل کنم.')
    expect(dialogueTexts).toContain('و اگر پلیس از راه برسد و همه‌ی خانه‌ها را تفتیش بکند چه؟')
    expect(dialogueTexts).toContain('آن‌ها دارند همه جا را خانه به خانه تفتیش می‌کنند!')
    expect(dialogueTexts).toContain('ما باید خانه را تفتیش کنیم.')
    expect(dialogueTexts).toContain('ما دو واحد کاملا مستقل از همدیگر هستیم.')
    expect(dialogueTexts).toContain('آن‌ها آدم‌های خوبی هستند و طرف ما را می‌گیرند.')
    expect(dialogueTexts).toContain('همه صاحب یک یخچال هستند!')
    expect(dialogueTexts).toContain('ابداً امکان ندارد!')
    expect(dialogueTexts + stageTexts).not.toContain('مرد و زن»')
    expect(dialogueTexts).toContain('مرد و زن، و واقعاً دست به یک اقدام پرشهامت زدیم.')
    expect(dialogueTexts).toContain('بعداً، بعداً... بهتر است آنتونیا برایت تعریف کند...')
    expect(dialogueTexts).toContain('چه گرما و رطوبتی...')
    expect(dialogueTexts).toContain('۳۰۰ نفر شاغل، و همه همسو با ما.')
    expect(dialogueTexts).toContain('برای آن‌ها ما از سگ هم بدتریم!')
    expect(dialogueTexts + stageTexts).toContain('روی میز می‌گذارد')
    expect(dialogueTexts).toContain('بعد هم پوشش امنیت نظامی از راه')
    expect(dialogueTexts + stageTexts).toContain('لوئیجی و جووانی از راه می‌رسند')
    expect(dialogueTexts).toContain('فکر کنیم، همیشه ما!')
    expect(dialogueTexts).toContain('گناهکار هستی اگر بچه نیاوری!')
    expect(dialogueTexts).toContain('خدا را شکر!')
    expect(dialogueTexts).toContain('شکر! یعنی محتوای آن‌ها شکر است؟')
    expect(dialogueTexts).toContain('سلام، پدر!')
    expect(dialogueTexts).toContain('دولت سکه می‌شمارد؟!')
    expect(dialogueTexts).toContain('ببینید! حمل ونقل خارجی!')
    expect(dialogueTexts).toContain('و آن وقت صاحب فرزند شد!')
    expect(dialogueTexts).toContain('آن پیچ را ببند! سریع! نه. نه. آن‌طرفی...')
    expect(dialogueTexts).toContain('نخیر! به قوت خود باقی می‌ماند.')
    expect(dialogueTexts).toContain('انگار داریم در ارتش خدمت می‌کنیم!')
    expect(dialogueTexts).toContain('آن‌چه روی کامیون نوشته‌اند، بار نمی‌کنند و کارشان منظم است!')
    expect(dialogueTexts).toContain('به آن پشت، پشت سر نگاه کن!')
    expect(dialogueTexts).toContain('حتی می‌تواند حالت تزئینی خوبی داشته باشد. البته اگر بخواهید...')
    expect((dialogueTexts + stageTexts).split('مارگریتا مایحتاج گوناگون را زیر پیراهنش جا می‌دهد').length - 1).toBe(1)
  })

  it('is exposed with reserved id and complete discovery metadata', () => {
    expect(hesabPardakhtNemishePlay).toMatchObject({
      id: HESAB_PARDAKHT_NEMISHE_BUNDLED_ID,
      title: 'حساب پرداخت نمی‌شه!',
      author: 'داریو فو',
      translator: 'حامد جهانشاهی',
      genres: ['کمدی']
    })
    expect(hesabPardakhtNemishePlay.characters.every((character) =>
      ['male', 'female', 'unknown'].includes(character.gender ?? '')
    )).toBe(true)
    expect(bundledPlays.map((play) => play.id)).toContain(HESAB_PARDAKHT_NEMISHE_BUNDLED_ID)
    expect(new Set(bundledPlays.map((play) => play.id)).size).toBe(bundledPlays.length)
  })
})
