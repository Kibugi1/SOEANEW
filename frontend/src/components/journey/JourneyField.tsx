"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import type { AnswerValue } from "@/lib/submissions";
import type { JourneyField as Field } from "@/components/journey/types";

type JourneyFieldProps = {
  field: Field;
  value: AnswerValue | undefined;
  error?: string;
  autoFocus?: boolean;
  onChange: (value: AnswerValue) => void;
  /** Called when a single choice is picked, so the journey can move on. */
  onChoose?: () => void;
  onEnter?: () => void;
};

export default function JourneyField({
  field,
  value,
  error,
  autoFocus,
  onChange,
  onChoose,
  onEnter,
}: JourneyFieldProps) {
  const errorId = `${field.name}-error`;
  const helperId = `${field.name}-helper`;

  if (field.type === "choice" || field.type === "multichoice") {
    const multiple = field.type === "multichoice";
    const selected = multiple
      ? Array.isArray(value) ? value : []
      : typeof value === "string" ? [value] : [];

    const toggle = (optionValue: string) => {
      if (multiple) {
        onChange(
          selected.includes(optionValue)
            ? selected.filter((item) => item !== optionValue)
            : [...selected, optionValue]
        );
      } else {
        onChange(optionValue);
        onChoose?.();
      }
    };

    return (
      <Box>
        <Typography id={`${field.name}-label`} sx={{ mb: 1.5, fontWeight: 600, fontSize: "0.9rem" }}>
          {field.label}
          {multiple && (
            <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>
              {" "}· choose all that apply
            </Box>
          )}
        </Typography>
        <Box
          role={multiple ? "group" : "radiogroup"}
          aria-labelledby={`${field.name}-label`}
          aria-describedby={error ? errorId : undefined}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 1.5,
          }}
        >
          {field.options?.map((option, index) => {
            const isSelected = selected.includes(option.value);
            return (
              <ButtonBase
                key={option.value}
                role={multiple ? "checkbox" : "radio"}
                aria-checked={isSelected}
                autoFocus={autoFocus && index === 0}
                onClick={() => toggle(option.value)}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  gap: 1.5,
                  p: 2,
                  textAlign: "left",
                  borderRadius: 1,
                  border: 2,
                  borderColor: isSelected ? "primary.main" : "divider",
                  bgcolor: isSelected ? "background.subtle" : "background.paper",
                  transition: "border-color 150ms ease, background-color 150ms ease, transform 150ms ease",
                  "&:hover": { borderColor: isSelected ? "primary.main" : "primary.light" },
                  "&:active": { transform: "scale(0.99)" },
                  "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.dark", outlineOffset: 2 },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    mt: 0.25,
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: multiple ? 0.5 : "50%",
                    border: 2,
                    borderColor: isSelected ? "primary.main" : "text.disabled",
                    bgcolor: isSelected ? "primary.main" : "transparent",
                    color: "primary.contrastText",
                  }}
                >
                  {isSelected && <CheckRoundedIcon sx={{ fontSize: 14 }} />}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.4 }}>
                    {option.label}
                  </Typography>
                  {option.description && (
                    <Typography sx={{ mt: 0.5, fontSize: "0.8rem", color: "text.secondary", lineHeight: 1.5 }}>
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
        {error && (
          <Typography id={errorId} role="alert" sx={{ mt: 1.5, color: "error.main", fontSize: "0.85rem" }}>
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  const isTextarea = field.type === "textarea";

  return (
    <TextField
      name={field.name}
      type={isTextarea ? "text" : field.type}
      label={field.optional ? `${field.label} (optional)` : field.label}
      placeholder={field.placeholder}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        const submitKey = isTextarea
          ? event.key === "Enter" && (event.metaKey || event.ctrlKey)
          : event.key === "Enter";
        if (submitKey) {
          event.preventDefault();
          onEnter?.();
        }
      }}
      autoFocus={autoFocus}
      autoComplete={field.autoComplete}
      required={!field.optional}
      multiline={isTextarea}
      minRows={isTextarea ? 4 : undefined}
      fullWidth
      error={Boolean(error)}
      helperText={error ?? field.helper ?? (isTextarea ? "Press Ctrl + Enter to continue" : undefined)}
      slotProps={{
        htmlInput: { maxLength: field.maxLength, "aria-describedby": error ? errorId : helperId },
        formHelperText: { id: error ? errorId : helperId },
      }}
      sx={{
        "& .MuiInputBase-input": { fontSize: { xs: "1.05rem", md: "1.2rem" } },
      }}
    />
  );
}
