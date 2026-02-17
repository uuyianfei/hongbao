import { pinyin } from 'pinyin-pro';

// 国际摩斯密码映射表
const MORSE_CODE_MAP: Record<string, string> = {
  'a': '.-',     'b': '-...',   'c': '-.-.',   'd': '-..',
  'e': '.',      'f': '..-.',   'g': '--.',    'h': '....',
  'i': '..',     'j': '.---',   'k': '-.-',    'l': '.-..',
  'm': '--',     'n': '-.',     'o': '---',    'p': '.--.',
  'q': '--.-',   'r': '.-.',    's': '...',    't': '-',
  'u': '..-',    'v': '...-',   'w': '.--',    'x': '-..-',
  'y': '-.--',   'z': '--..',
  '0': '-----',  '1': '.----',  '2': '..---',  '3': '...--',
  '4': '....-',  '5': '.....',  '6': '-....',  '7': '--...',
  '8': '---..',  '9': '----.',
};

// 反向映射表（摩斯密码 -> 字母）
const REVERSE_MORSE_MAP: Record<string, string> = {};
for (const [char, code] of Object.entries(MORSE_CODE_MAP)) {
  REVERSE_MORSE_MAP[code] = char;
}

/**
 * 将汉字转换为拼音（不带声调）
 */
export function chineseToPlainPinyin(text: string): string[] {
  const result: string[] = [];
  for (const char of text) {
    const py = pinyin(char, { toneType: 'none', type: 'array' });
    if (py.length > 0) {
      result.push(py[0].toLowerCase());
    }
  }
  return result;
}

/**
 * 将拼音转为摩斯密码
 * 每个字母之间用空格分隔，每个拼音之间用 / 分隔
 */
export function pinyinToMorse(pinyinArr: string[]): string {
  return pinyinArr.map(py => {
    return py.split('').map(ch => {
      return MORSE_CODE_MAP[ch] || '';
    }).filter(Boolean).join(' ');
  }).join(' / ');
}

/**
 * 将摩斯密码解码为拼音数组
 */
export function morseToPinyin(morseStr: string): string[] {
  const words = morseStr.split(' / ');
  return words.map(word => {
    return word.split(' ').map(code => {
      return REVERSE_MORSE_MAP[code] || '';
    }).join('');
  });
}

/**
 * 将汉字直接转为摩斯密码字符串
 */
export function chineseToMorse(text: string): string {
  const pinyinArr = chineseToPlainPinyin(text);
  return pinyinToMorse(pinyinArr);
}

/**
 * 从文本片段中随机抽取 N 个不重复的汉字
 * 优先选取不同拼音的汉字以增加辨识度
 */
export function pickRandomChars(text: string, count: number = 4): { chars: string; indices: number[] } {
  // 过滤出汉字字符及其索引
  const chineseChars: { char: string; index: number; py: string }[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[\u4e00-\u9fa5]/.test(char)) {
      const py = pinyin(char, { toneType: 'none', type: 'array' })[0];
      chineseChars.push({ char, index: i, py: py?.toLowerCase() || '' });
    }
  }

  if (chineseChars.length < count) {
    count = chineseChars.length;
  }

  // 尝试选择不同拼音的汉字
  const selected: typeof chineseChars = [];
  const usedPinyins = new Set<string>();
  const shuffled = [...chineseChars].sort(() => Math.random() - 0.5);

  // 第一轮：优先选不同拼音的
  for (const item of shuffled) {
    if (selected.length >= count) break;
    if (!usedPinyins.has(item.py)) {
      selected.push(item);
      usedPinyins.add(item.py);
    }
  }

  // 如果不够，再从剩下的里面随机补充
  if (selected.length < count) {
    for (const item of shuffled) {
      if (selected.length >= count) break;
      if (!selected.includes(item)) {
        selected.push(item);
      }
    }
  }

  // 按照在原文中出现的顺序排序
  selected.sort((a, b) => a.index - b.index);

  return {
    chars: selected.map(s => s.char).join(''),
    indices: selected.map(s => s.index),
  };
}

/**
 * 生成摩斯密码的时序数据（用于前端 Web Audio API 播放）
 * 返回一个描述音频节拍的数组
 */
export function generateMorseTimeline(morseStr: string): MorseTimeline {
  const DOT_DURATION = 200;    // 点持续时间 ms
  const DASH_DURATION = 600;   // 划持续时间 ms
  const SYMBOL_GAP = 200;      // 同一字母内符号间隔
  const LETTER_GAP = 600;      // 字母间隔
  const WORD_GAP = 1400;       // 单词（拼音）间隔

  const events: MorseEvent[] = [];
  let currentTime = 0;

  const parts = morseStr.split(' / ');

  for (let wi = 0; wi < parts.length; wi++) {
    const letters = parts[wi].trim().split(' ');

    for (let li = 0; li < letters.length; li++) {
      const letter = letters[li];

      for (let si = 0; si < letter.length; si++) {
        const symbol = letter[si];
        if (symbol === '.') {
          events.push({ type: 'tone', start: currentTime, duration: DOT_DURATION });
          currentTime += DOT_DURATION;
        } else if (symbol === '-') {
          events.push({ type: 'tone', start: currentTime, duration: DASH_DURATION });
          currentTime += DASH_DURATION;
        }

        // 符号间间隔
        if (si < letter.length - 1) {
          currentTime += SYMBOL_GAP;
        }
      }

      // 字母间隔
      if (li < letters.length - 1) {
        currentTime += LETTER_GAP;
      }
    }

    // 单词间隔
    if (wi < parts.length - 1) {
      currentTime += WORD_GAP;
    }
  }

  return {
    events,
    totalDuration: currentTime,
    morseString: morseStr,
  };
}

export interface MorseEvent {
  type: 'tone';
  start: number;   // 开始时间 ms
  duration: number; // 持续时间 ms
}

export interface MorseTimeline {
  events: MorseEvent[];
  totalDuration: number;
  morseString: string;
}
