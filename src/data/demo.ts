import type { Play } from '../types'

export const demoPlay: Play = {
  id: 'horses-behind-the-window',
  title: 'اسب‌های پشت پنجره',
  author: 'ماتئی ویسنی‌یک',
  translator: 'تینوش نظم‌جو',
  characters: [
    { id: 'messenger', name: 'پیک', color: '#ffb7b2' },
    { id: 'mother', name: 'مادر', color: '#b5ead7' },
    { id: 'son', name: 'پسر', color: '#c7ceea' },
    { id: 'father', name: 'پدر', color: '#ffd6a5' },
    { id: 'daughter', name: 'دختر', color: '#9bf6ff' },
    { id: 'husband', name: 'شوهر', color: '#ffc6ff' },
    { id: 'wife', name: 'زن', color: '#e2f0cb' }
  ],
  acts: [
    {
      id: 'act-1',
      title: 'بخش اول',
      scenes: [
        {
          id: 'scene-1',
          title: 'مادر و پسر',
          blocks: [
            { id: 's1-direction-1', type: 'stage-direction', text: 'پیک وارد می‌شود، میز پارتیتورها را نصب می‌کند و طبلش را به گردن می‌اندازد.' },
            { id: 's1-1', type: 'dialogue', characterId: 'messenger', parts: [{ type: 'speech', text: 'هزار و ششصد و نود و نه.' }, { type: 'direction', text: 'صدای طبل' }, { type: 'speech', text: 'صلح کارلوویتز.' }] },
            { id: 's1-direction-2', type: 'stage-direction', text: 'نور اتاقی پنجره‌دار را آشکار می‌کند. پسر یونیفورم ارتشی به تن دارد و مادر پالتوی نظامی‌اش را می‌آورد.' },
            { id: 's1-2', type: 'dialogue', characterId: 'mother', parts: [{ type: 'speech', text: 'قدته؟' }] },
            { id: 's1-3', type: 'dialogue', characterId: 'son', parts: [{ type: 'speech', text: 'بله.' }] },
            { id: 's1-4', type: 'dialogue', characterId: 'mother', parts: [{ type: 'speech', text: 'اذیتت نمی‌کنه؟' }] },
            { id: 's1-5', type: 'dialogue', characterId: 'son', parts: [{ type: 'speech', text: 'نه.' }] },
            { id: 's1-6', type: 'dialogue', characterId: 'son', parts: [{ type: 'speech', text: 'الان یه اسب دیدم از اینجا گذشت.' }] },
            { id: 's1-7', type: 'dialogue', characterId: 'mother', parts: [{ type: 'speech', text: 'غذا خوردی؟' }] },
            { id: 's1-8', type: 'dialogue', characterId: 'son', parts: [{ type: 'speech', text: 'نه.' }] },
            { id: 's1-9', type: 'dialogue', characterId: 'mother', parts: [{ type: 'speech', text: 'پس نباید پالتوت رو می‌پوشیدی. باید غذا می‌خوردی بعد پالتو می‌پوشیدی.' }] },
            { id: 's1-10', type: 'dialogue', characterId: 'son', parts: [{ type: 'speech', text: 'اسبه الان وایستاده. داره من رو نگاه می‌کنه.' }] },
            { id: 's1-11', type: 'dialogue', characterId: 'mother', parts: [{ type: 'speech', text: 'هر روز برام یه کارت پستال بفرست.' }, { type: 'direction', text: 'با ناامیدی به پسرش می‌چسبد' }, { type: 'speech', text: 'دیگه هم هیچ وقت به اسب لکه‌سیاه فکر نکن.' }] },
            { id: 's1-12', type: 'dialogue', characterId: 'messenger', parts: [{ type: 'speech', text: 'سلام خانم، اجازه هست این گل‌ها رو پیشکش‌تون کنم؟' }] },
            { id: 's1-13', type: 'dialogue', characterId: 'mother', parts: [{ type: 'speech', text: 'آقا، شما اومدین یه خبر بد به من بدین. درسته؟' }] },
            { id: 's1-14', type: 'dialogue', characterId: 'messenger', parts: [{ type: 'speech', text: 'بله، خانم. ولی نمی‌دونم از کجا باید شروع کنم.' }] },
            { id: 's1-15', type: 'dialogue', characterId: 'mother', parts: [{ type: 'speech', text: 'پسرم مرده؟' }] },
            { id: 's1-16', type: 'dialogue', characterId: 'messenger', parts: [{ type: 'speech', text: 'بله، خانم.' }] }
          ]
        },
        {
          id: 'scene-2',
          title: 'پدر و دختر',
          blocks: [
            { id: 's2-direction-1', type: 'stage-direction', text: 'نور روی دختر می‌آید. پدر روی صندلی چرخ‌دار وارد اتاق می‌شود.' },
            { id: 's2-1', type: 'dialogue', characterId: 'father', parts: [{ type: 'speech', text: 'کی بود؟ می‌خوام بدونم کی اینجا بود؟' }] },
            { id: 's2-2', type: 'dialogue', characterId: 'daughter', parts: [{ type: 'speech', text: 'هیچ‌کی نبود.' }] },
            { id: 's2-3', type: 'dialogue', characterId: 'father', parts: [{ type: 'speech', text: 'یکی در رو به هم کوبید. شنیدم.' }] },
            { id: 's2-4', type: 'dialogue', characterId: 'daughter', parts: [{ type: 'speech', text: 'بیا می‌برمت اتاقت.' }] },
            { id: 's2-5', type: 'dialogue', characterId: 'messenger', parts: [{ type: 'speech', text: 'یه وقت مزاحم نباشم.' }] },
            { id: 's2-6', type: 'dialogue', characterId: 'daughter', parts: [{ type: 'speech', text: 'ابداً. ولی من منظورتون رو متوجه نمی‌شم.' }] }
          ]
        },
        {
          id: 'scene-3',
          title: 'زن و شوهر',
          blocks: [
            { id: 's3-1', type: 'dialogue', characterId: 'husband', parts: [{ type: 'speech', text: 'کاسه‌ها رو هم بیار بیرون.' }] },
            { id: 's3-2', type: 'dialogue', characterId: 'wife', parts: [{ type: 'speech', text: 'کدوم کاسه‌ها؟' }] },
            { id: 's3-3', type: 'dialogue', characterId: 'husband', parts: [{ type: 'speech', text: 'گنده‌ها! گنده‌ها!' }] },
            { id: 's3-4', type: 'dialogue', characterId: 'wife', parts: [{ type: 'speech', text: 'حرص نخور، هانس!' }] },
            { id: 's3-5', type: 'dialogue', characterId: 'messenger', parts: [{ type: 'speech', text: 'مزاحم شدم؟ می‌شه یه چند لحظه بیام بشینم؟' }] },
            { id: 's3-6', type: 'dialogue', characterId: 'wife', parts: [{ type: 'speech', text: 'خواهش می‌کنم.' }] }
          ]
        }
      ]
    }
  ]
}
