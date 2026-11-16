/* Exact quantities and Korean number words for picture play. No DOM or audio. */
(function (root) {
  'use strict';

  const MAX_QUANTITY = 30;
  const MAX_GROUPS = 6;
  const NATIVE = Object.freeze([
    '영', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉',
    '열', '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉',
    '스물', '스물하나', '스물둘', '스물셋', '스물넷', '스물다섯', '스물여섯', '스물일곱', '스물여덟', '스물아홉', '서른'
  ]);
  const SINO_ONES = Object.freeze(['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']);
  const ENGLISH = Object.freeze([
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
    'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty'
  ]);
  const ENGLISH_UNITS = Object.freeze({
    '개': ['item', 'items'], '대': ['vehicle', 'vehicles'],
    '마리': ['animal', 'animals'], '송이': ['flower', 'flowers'],
    '명': ['person', 'people'], '칸': ['space', 'spaces'],
    '곳': ['place', 'places'], '그루': ['tree', 'trees'], '장': ['sheet', 'sheets'],
    '채': ['house', 'houses'], '척': ['boat', 'boats']
  });

  function invalid(code, message) {
    const error = new RangeError(message);
    error.code = code;
    return error;
  }

  function isQuantity(value) {
    return Number.isInteger(value) && value >= 0 && value <= MAX_QUANTITY;
  }

  function checkedQuantity(value, name) {
    if (!isQuantity(value)) throw invalid('QUANTITY_OUT_OF_RANGE', (name || 'quantity') + ' must be an integer from 0 to 30.');
    return value;
  }

  function countWord(value, style, language) {
    const n = checkedQuantity(value);
    style = style == null ? 'native' : style;
    language = language == null ? 'ko' : language;
    if (style !== 'native' && style !== 'sino') throw invalid('READING_STYLE_INVALID', 'reading style must be native or sino.');
    if (language !== 'ko' && language !== 'en') throw invalid('LANGUAGE_INVALID', 'language must be ko or en.');
    if (language === 'en') return ENGLISH[n];
    if (style === 'native') return NATIVE[n];
    if (n === 0) return '영';
    if (n < 10) return SINO_ONES[n];
    const tens = Math.floor(n / 10);
    return (tens === 1 ? '' : SINO_ONES[tens]) + '십' + SINO_ONES[n % 10];
  }

  function determiner(value) {
    const n = checkedQuantity(value);
    if (n === 20) return '스무';
    const last = n % 10;
    if (last >= 1 && last <= 4) {
      const prefix = n >= 20 ? '스물' : n >= 10 ? '열' : '';
      return prefix + ['', '한', '두', '세', '네'][last];
    }
    return NATIVE[n];
  }

  function quantityText(value, unit, language) {
    const n = checkedQuantity(value);
    unit = unit == null ? '개' : unit;
    language = language == null ? 'ko' : language;
    if (typeof unit !== 'string' || !unit.trim()) throw invalid('UNIT_INVALID', 'a nonempty unit is required.');
    if (language !== 'ko' && language !== 'en') throw invalid('LANGUAGE_INVALID', 'language must be ko or en.');
    if (language === 'en') {
      if (n === 0) return 'None here';
      const words = ENGLISH_UNITS[unit] || ENGLISH_UNITS['개'];
      return ENGLISH[n] + ' ' + words[n === 1 ? 0 : 1];
    }
    // Zero has no object to count; its screen uses a separate empty-state message.
    if (n === 0) return '하나도 없어요';
    return determiner(n) + ' ' + unit.trim();
  }

  function items(value, prefix) {
    const n = checkedQuantity(value);
    prefix = prefix == null ? 'item' : prefix;
    if (typeof prefix !== 'string' || !prefix.trim()) throw invalid('ITEM_PREFIX_INVALID', 'a nonempty item prefix is required.');
    return Array.from({ length: n }, function (_, index) {
      return { id: prefix + '-' + (index + 1), index: index, ordinal: index + 1 };
    });
  }

  function addition(leftValue, rightValue) {
    const a = checkedQuantity(leftValue, 'left quantity');
    const b = checkedQuantity(rightValue, 'right quantity');
    const total = a + b;
    if (total > MAX_QUANTITY) throw invalid('SUM_OUT_OF_RANGE', 'the total must not exceed 30.');
    const left = items(a, 'left').map(function (item) { return Object.assign(item, { source: 'left', groupIndex: 0 }); });
    const right = items(b, 'right').map(function (item) { return Object.assign(item, { source: 'right', groupIndex: 1 }); });
    return { a: a, b: b, total: total, left: left, right: right, items: left.concat(right) };
  }

  function comparison(leftValue, rightValue) {
    const a = checkedQuantity(leftValue, 'left quantity');
    const b = checkedQuantity(rightValue, 'right quantity');
    const pairCount = Math.min(a, b);
    // Each side is independently limited to 30; their combined display may hold 60.
    const left = items(a, 'compare-left');
    const right = items(b, 'compare-right');
    return {
      a: a, b: b, pairCount: pairCount, difference: Math.abs(a - b),
      relation: a === b ? 'equal' : a > b ? 'left' : 'right',
      left: left, right: right,
      pairs: left.slice(0, pairCount).map(function (item, index) { return { left: item, right: right[index] }; }),
      leftExtra: left.slice(pairCount), rightExtra: right.slice(pairCount)
    };
  }

  function subtraction(originalValue, departingValue) {
    const a = checkedQuantity(originalValue, 'original quantity');
    const b = checkedQuantity(departingValue, 'departing quantity');
    if (b > a) throw invalid('SUBTRACTION_OUT_OF_RANGE', 'the departing quantity must not exceed the original quantity.');
    const original = items(a, 'subtract');
    const remainingCount = a - b;
    // Leave from the right-hand end. Every ledger entry keeps the original object.
    const departed = original.slice(remainingCount).reverse();
    return {
      a: a, b: b, remainingCount: remainingCount, original: original,
      remaining: original.slice(0, remainingCount), departed: departed,
      moves: departed.map(function (item, index) {
        return { item: item, remainingAfter: a - index - 1, departedAfter: index + 1 };
      })
    };
  }

  function equalShare(value, count) {
    const total = checkedQuantity(value);
    if (!Number.isInteger(count) || count < 1 || count > MAX_GROUPS) {
      throw invalid('GROUP_COUNT_OUT_OF_RANGE', 'group count must be an integer from 1 to 6.');
    }
    const each = Math.floor(total / count);
    const remainder = total % count;
    const all = items(total, 'share');
    const groups = Array.from({ length: count }, function () { return []; });
    const moves = [];
    // Complete rounds only. Remainders stay outside the equal groups.
    for (let round = 0; round < each; round += 1) {
      for (let groupIndex = 0; groupIndex < count; groupIndex += 1) {
        const item = all[round * count + groupIndex];
        groups[groupIndex].push(item);
        moves.push({ item: item, groupIndex: groupIndex, groupCountAfter: round + 1 });
      }
    }
    return {
      total: total, groupCount: count, each: each, remainder: remainder,
      groups: groups, remaining: all.slice(each * count), moves: moves
    };
  }

  const API = Object.freeze({
    MAX_QUANTITY: MAX_QUANTITY, MAX_GROUPS: MAX_GROUPS,
    isQuantity: isQuantity, countWord: countWord, determiner: determiner,
    quantityText: quantityText, items: items, addition: addition, equalShare: equalShare,
    comparison: comparison, subtraction: subtraction
  });
  root.SihyeonQuantityPlayModel = API;
  if (typeof module === 'object' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
