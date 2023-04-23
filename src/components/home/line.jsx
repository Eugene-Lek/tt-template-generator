export const Line = ({raw_text, color, font_size, margin_right, margin_left, text_align}) => {
    const message_with_markdown = raw_text.replace(/\s\*/g, ' __*').replace(/\*\s/g, '*__ ')
    const line_segments = message_with_markdown.split('__')
    return (
        <div style={{marginRight: margin_right, marginLeft: margin_left, textAlign: text_align}}>
        {line_segments.map((segment, index) => {
            if (segment.startsWith('*') && segment.endsWith('*')){
                return <span key={index} style={{fontWeight: "bold", color: color, fontSize: font_size}}>{segment.slice(1, -1)}</span>
            } else {
                return <span key={index} style={{color: color, fontSize: font_size}}>{segment}</span>
            }
        })}
        </div>
    )
}