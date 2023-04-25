import {Line} from "src/components/home/line"

export function Dialog({ message, buttons, line_props, onClickDialog, onClickDialogProps, isBlocking=false}) {
    
    const lines = message.split("\n") // Remove all extra spaces then split by new line
    const num_lines = lines.length
    const num_line_props_provided = line_props.length
    if (num_line_props_provided<num_lines){
      var line_props_refined = [...line_props, ...Array(num_lines-num_line_props_provided).fill(line_props.slice(-1)[0])]
    } else {
      var line_props_refined = line_props
    }
    return ( 
      <div className="dialog-background" onClick={() => {onClickDialog({...onClickDialogProps, action:"exit"})}}>
        <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-message">
            {lines.map((line, i) => {
              return <Line 
                key={i}
                raw_text={line} 
                color={line_props_refined[i]["color"]} 
                font_size={line_props_refined[i]["font_size"]}
                margin_right = {line_props_refined[i]["margin_right"]}
                margin_left = {line_props_refined[i]["margin_left"]}
                text_align = {line_props_refined[i]["text_align"]}
              />
            })}
          </div>
          <div className="dialog-buttons">
            {buttons.map((button_props, index) => {
              return (
                <button
                key={index}
                onClick={() => onClickDialog({...onClickDialogProps, "action": button_props.action})}
                style={{
                  background: button_props.background,
                  color: button_props.color,              
                  border: "none",
                  cursor: "pointer",
                  padding: "10px",
                  borderRadius: "10px"
                }}
                >{button_props.text}</button>
              )
            })}
          </div>
        </div>
      </div>
    );
  }

  