/**
 * SELAH — MONEY, AND THE TWO CURRENCIES
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE LAW: WE NEVER SILENTLY CONVERT.
 *
 * Many Ugandans hold a USD savings account. The tempting thing — the thing every
 * app does — is to pick a rate, turn the dollars into shillings, and print ONE
 * BEAUTIFUL NET WORTH FIGURE.
 *
 * That figure is invented. Not the dollars, and not the shillings: the RATE. And
 * a rate is not a fact, it is a price on a day, at a bank, with a spread — the
 * rate you get selling 200 dollars at a forex bureau in Kikuubo is not the rate
 * on the Bank of Uganda's page, and neither is the rate your bank will actually
 * give you.
 *
 * So an app that quietly converts has put a NUMBER NOBODY CHOSE at the top of a
 * person's financial life, and then let them make decisions on it.
 *
 * In Selah:
 *
 *   1. Every amount carries its CURRENCY. There is no bare number.
 *   2. You may NOT add UGX to USD. The function REFUSES. It does not coerce.
 *   3. A conversion requires a RATE and a DATE, given by a human, and the result
 *      is LABELLED as converted, at that rate, on that day.
 *   4. With no rate, we show BOTH totals, side by side, and say we will not
 *      combine them. Two true numbers beat one invented one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 AND THE SECOND TRAP: MINOR UNITS.
 *
 * UGX has no subunit in practice — the coins are gone, and a shilling is a whole
 * shilling. USD has cents. Store both as FLOATS and you will, eventually and
 * silently, lose a cent — and a tax platform that loses cents has no business
 * telling anybody they have lost cents.
 *
 * So every amount is an INTEGER of its MINOR UNIT: 1 for UGX, 100 for USD.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { refuse } = require('./engine');

const CURRENCIES = {
  UGX: { code: 'UGX', symbol: 'UGX', minor: 1,   decimals: 0, label: 'Uganda shilling',
         note: 'Whole shillings. The coins are gone; there is no subunit worth tracking.' },
  USD: { code: 'USD', symbol: '$',   minor: 100, decimals: 2, label: 'US dollar',
         note: 'Held by many Ugandans as a store of value. Cents matter — stored as integer cents, never as a float.' },
};

const isCurrency = (c) => Object.prototype.hasOwnProperty.call(CURRENCIES, String(c || '').toUpperCase());

/** { amount, currency } — the only shape a sum of money may take in this system. */
function money(amount, currency) {
  const c = String(currency || 'UGX').toUpperCase();
  if (!isCurrency(c)) return null;
  const spec = CURRENCIES[c];
  // Integer minor units. Round ONCE, here, and never again downstream.
  const minor = Math.round(Number(amount || 0) * spec.minor);
  return { minor, currency: c };
}

/** Back to a human number: 250000 → 250000 (UGX); 12345 cents → 123.45 (USD) */
const toMajor = (m) => (m && CURRENCIES[m.currency]) ? m.minor / CURRENCIES[m.currency].minor : 0;

function format(m) {
  if (!m || !CURRENCIES[m.currency]) return '';
  const spec = CURRENCIES[m.currency];
  const major = m.minor / spec.minor;
  return `${spec.symbol} ${major.toLocaleString('en-UG', {
    minimumFractionDigits: spec.decimals, maximumFractionDigits: spec.decimals })}`;
}

/**
 * 🔴 ADDING UGX TO USD IS REFUSED. It is not a rounding problem; it is a category
 * error, and the only reason software does it is that a number feels better than
 * a question.
 */
function add(amounts) {
  const list = (Array.isArray(amounts) ? amounts : []).filter(Boolean);
  if (!list.length) return money(0, 'UGX');

  const currencies = [...new Set(list.map((m) => m.currency))];
  if (currencies.length > 1) {
    return refuse({ label: 'Money' }, {
      question: 'What is the total?',
      because: `These amounts are in different currencies (${currencies.join(' and ')}), and there is no true total without a rate.`,
      weWillNot: 'We will not pick an exchange rate for you. The rate at a forex bureau in Kikuubo, the rate on the Bank of Uganda page, and the rate your bank will actually give you are three different numbers — and only one of them ends up in your pocket.',
      whatWouldUnblockThis: 'Give us a rate and the date you got it, and we will convert — and we will say, on the screen, that we did.',
      totals: currencies.map((c) => ({
        currency: c,
        minor: list.filter((m) => m.currency === c).reduce((s, m) => s + m.minor, 0),
      })),
    });
  }
  return { minor: list.reduce((s, m) => s + m.minor, 0), currency: currencies[0] };
}

/**
 * Convert — ONLY with a rate a human gave us, and the result says so, for ever.
 */
function convert(m, toCurrency, rate, on, source) {
  const to = String(toCurrency || '').toUpperCase();
  if (!m || !isCurrency(to)) return null;
  if (m.currency === to) return { ...m, converted: false };

  if (!(Number(rate) > 0)) {
    return refuse({ label: 'Money' }, {
      question: `What is ${m.currency} worth in ${to}?`,
      because: 'We have no exchange rate, and we do not have one to hand.',
      weWillNot: 'We will not invent a rate to make a total look tidy. An invented rate at the top of your net worth is a decision made on a number nobody chose.',
      whatWouldUnblockThis: 'The rate you would actually get, and the date you got it.',
    });
  }

  const major = toMajor(m) * Number(rate);
  const out = money(major, to);
  return {
    ...out,
    converted: true,
    from: { ...m },
    rate: Number(rate),
    rateOn: on || null,
    rateSource: source || null,
    // 🔴 This sentence must survive all the way to the screen.
    thisIsConverted: `Converted from ${format(m)} at ${Number(rate).toLocaleString()} on ${on || 'an unstated date'}. That is a rate you gave us, not a fact of the world — the number you actually get will differ.`,
  };
}

/**
 * Group a pile of money by currency. This is what a HONEST total looks like when
 * somebody holds two currencies and has not told us a rate: two true numbers,
 * side by side, rather than one invented one.
 */
function byCurrency(amounts) {
  const out = {};
  for (const m of (Array.isArray(amounts) ? amounts : []).filter(Boolean)) {
    out[m.currency] = out[m.currency] || { currency: m.currency, minor: 0, count: 0 };
    out[m.currency].minor += m.minor;
    out[m.currency].count += 1;
  }
  return Object.values(out);
}

module.exports = { CURRENCIES, isCurrency, money, toMajor, format, add, convert, byCurrency };
