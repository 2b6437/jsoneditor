// TODO: write unit tests for getPlainText and setPlainText

/**
 * Get the plain text from an HTML element
 * @param {Element} element  An HTML DOM element like a DIV
 * @return {string}
 */
export function getPlainText(element) {
  return unescapeHTML(traverseInnerText(element))
}

/**
 * Set plain text in an HTML element
 * @param {Element} element  An HTML DOM element like a DIV
 * @param {string} text
 */
export function setPlainText(element, text) {
  element.innerHTML = escapeHTML(text)
}
/**
 * escape a text, such that it can be displayed safely in an HTML element
 * @param {string} text
 * @param {boolean} [escapeUnicode=false]
 * @return {string} escapedText
 */
export function escapeHTML (text, escapeUnicode = false) {
  if (typeof text !== 'string') {
    return String(text)
  }
  else {
    let htmlEscaped = String(text)
    if (escapeUnicode === true) {
      // FIXME: should not unescape the just created non-breaking spaces \u00A0 ?
      htmlEscaped = escapeUnicodeChars(htmlEscaped)
    }

    htmlEscaped = htmlEscaped
      .replace(/ {2}/g, ' \u00A0') // replace double space with an nbsp and space
      .replace(/^ /, '\u00A0')   // space at start
      .replace(/ $/, '\u00A0')   // space at end

    const json = JSON.stringify(htmlEscaped)
    return json.substring(1, json.length - 1) // remove enclosing double quotes
  }
}

/**
 * Escape unicode characters.
 * For example input '\u2661' (length 1) will output '\\u2661' (length 5).
 * @param {string} text
 * @return {string}
 */
export function escapeUnicodeChars (text) {
  // see https://www.wikiwand.com/en/UTF-16
  // note: we leave surrogate pairs as two individual chars,
  // as JSON doesn't interpret them as a single unicode char.
  return text.replace(/[\u007F-\uFFFF]/g, function(c) {
    return '\\u'+('0000' + c.charCodeAt(0).toString(16)).slice(-4)
  })
}

/**
 * unescape a string.
 * @param {string} escapedText
 * @return {string} text
 */
export function unescapeHTML (escapedText) {
  const json = '"' + escapeJSON(escapedText) + '"'
  const htmlEscaped = JSON.parse(json) // TODO: replace with a JSON.parse which does do linting and give an informative error

  return htmlEscaped.replace(/\u00A0/g, ' ')  // nbsp character
}

/**
 * escape a text to make it a valid JSON string. The method will:
 *   - replace unescaped double quotes with '\"'
 *   - replace unescaped backslash with '\\'
 *   - replace returns with '\n'
 * @param {string} text
 * @return {string} escapedText
 * @private
 */
export function escapeJSON (text) {
  // TODO: replace with some smart regex (only when a new solution is faster!)
  let escaped = ''
  let i = 0
  while (i < text.length) {
    let c = text.charAt(i)
    if (c === '\n') {
      escaped += '\\n'
    }
    else if (c === '\\') {
      escaped += c
      i++

      c = text.charAt(i)
      if (c === '' || '"\\/bfnrtu'.indexOf(c) === -1) {
        escaped += '\\'  // no valid escape character
      }
      escaped += c
    }
    else if (c === '"') {
      escaped += '\\"'
    }
    else {
      escaped += c
    }
    i++
  }

  return escaped
}

/**
 * Get the inner text of an HTML element (for example a div element)
 * @param {Element} element
 * @param {Object} [buffer]
 * @return {string} innerText
 */
export function traverseInnerText (element, buffer) {
  const first = (buffer === undefined)
  if (first) {
    buffer = {
      _text: '',
      flush: function () {
        const text = this._text
        this._text = ''
        return text
      },
      set: function (text) {
        this._text = text
      }
    }
  }

  // text node
  if (element.nodeValue) {
    // remove return characters and the whitespace surrounding return characters
    const trimmedValue = element.nodeValue.replace(/\s*\n\s*/g, '')
    if (trimmedValue !== '') {
      return buffer.flush() + trimmedValue
    } else {
      // ignore empty text
      return ''
    }
  }

  // divs or other HTML elements
  if (element.hasChildNodes()) {
    const childNodes = element.childNodes
    let innerText = ''

    for (let i = 0, iMax = childNodes.length; i < iMax; i++) {
      const child = childNodes[i]

      if (child.nodeName === 'DIV' || child.nodeName === 'P') {
        const prevChild = childNodes[i - 1]
        const prevName = prevChild ? prevChild.nodeName : undefined
        if (prevName && prevName !== 'DIV' && prevName !== 'P' && prevName !== 'BR') {
          if (innerText !== '') {
            innerText += '\n'
          }
          buffer.flush()
        }
        innerText += traverseInnerText(child, buffer)
        buffer.set('\n')
      } else if (child.nodeName === 'BR') {
        innerText += buffer.flush()
        buffer.set('\n')
      } else {
        innerText += traverseInnerText(child, buffer)
      }
    }

    return innerText
  }

  // br or unknown
  return ''
}
