const BULLET_PATTERN = /^\s*(?:[-*•])\s+(.+)$/
const NUMBER_PATTERN = /^\s*\d+[.)]\s+(.+)$/

const toBlocks = (value = '') => {
  const lines = String(value || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let listType = null
  let listItems = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }

  const flushList = () => {
    if (!listItems.length) return
    blocks.push({ type: listType || 'ul', items: [...listItems] })
    listType = null
    listItems = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const bulletMatch = line.match(BULLET_PATTERN)
    if (bulletMatch) {
      flushParagraph()
      if (listType && listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(bulletMatch[1].trim())
      continue
    }

    const numberMatch = line.match(NUMBER_PATTERN)
    if (numberMatch) {
      flushParagraph()
      if (listType && listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(numberMatch[1].trim())
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

function RichTextContent({ value, className = '' }) {
  const blocks = toBlocks(value)
  if (!blocks.length) return null

  return (
    <div className={`min-w-0 max-w-full overflow-hidden break-words [overflow-wrap:anywhere] ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={`p-${index}`} className="min-w-0 max-w-full break-words text-sm leading-7 text-muted [overflow-wrap:anywhere]">
              {block.text}
            </p>
          )
        }

        const ListTag = block.type === 'ol' ? 'ol' : 'ul'
        return (
          <ListTag
            key={`${block.type}-${index}`}
            className={`space-y-2 pl-5 text-sm leading-7 text-muted ${block.type === 'ol' ? 'list-decimal' : 'list-disc'}`}
          >
            {block.items.map((item, itemIndex) => (
              <li key={`${block.type}-${index}-${itemIndex}`} className="break-words [overflow-wrap:anywhere]">{item}</li>
            ))}
          </ListTag>
        )
      })}
    </div>
  )
}

export default RichTextContent
