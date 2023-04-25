import { Line } from "src/components/home/line"
import Select from "react-select"

export function CreateUnitDialog({ unit, selected_copy_unit, set_selected_copy_unit, available_unit_options, onClickDialog, onClickDialogProps }) {
  return ( 
    <div className="dialog-background" onClick={(event) => {onClickDialog({ ...onClickDialogProps, action: "exit" })}}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-message">
          <Line raw_text={`*Initialise ${unit}'s T&T template generator with templates from:*`} color="#000000" font_size="16px" margin_right="auto" margin_left="auto" text_align="center" />
        </div>
        <Select
          className="search-by-title"
          instanceId={"owiejfp238yrn984wuepf"}
          onChange={option=>set_selected_copy_unit(option)}
          options={available_unit_options}
          value={selected_copy_unit}
          placeholder={"Search by Unit"}
        />
        <div className="dialog-buttons">
          <button onClick={() => onClickDialog({ ...onClickDialogProps, "action": "create", selected_copy_unit: selected_copy_unit.value})}
            style={{
              background: "#00ac13",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              padding: "10px",
              borderRadius: "10px"
            }}
          >Create</button>
          <button onClick={() => onClickDialog({ ...onClickDialogProps, "action": "cancel" })}
            style={{
              background: "#E60023",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              padding: "10px",
              borderRadius: "10px"
            }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}

