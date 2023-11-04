import React, { FC, InputHTMLAttributes } from "react";
import classNames from "classnames";
import { Typography } from "./Typography";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  type: "text" | "email" | "password";
  value: string;
  label?: string;
  leadingText?: string;
  placeholder: string;
  error?: string | boolean;
  helperText?: string;
  LeadingIcon?: React.ReactElement;
  TrailingIcon?: React.ReactElement;
  disabled?: boolean;
}

export const Input: FC<InputProps> = ({
  type,
  value,
  label,
  leadingText,
  placeholder,
  error,
  helperText,
  LeadingIcon,
  TrailingIcon,
  disabled,
  ...props
}) => {
  return (
    <div>
      {label ? (
        <Typography
          as="label"
          variant="sm"
          customWeight="medium"
          customColor="text-gray-700 dark:text-white"
          className="mb-1.5"
        >
          {label}
        </Typography>
      ) : null}

      <div
        className={classNames("relative", {
          "flex items-center": leadingText,
        })}
      >
        <div className="h-11 shadow-sm rounded-lg w-full absolute flex items-center justify-between px-3.5 pointer-events-none">
          {LeadingIcon ? (
            <LeadingIcon.type className="text-gray-500" />
          ) : (
            <div />
          )}
          {TrailingIcon ? (
            <TrailingIcon.type
              className={classNames({
                "text-gray-400": !error,
                "text-error-500": error,
              })}
            />
          ) : null}
        </div>

        {leadingText ? (
          <div
            className={classNames(
              "flex items-center h-11 text-lg text-gray-500 pl-3.5 pr-3 border border-r-0 rounded-l-lg border-gray-300 dark:border-gray-500",
              {
                "bg-gray-50 dark:bg-gray-700": disabled,
                "dark:bg-gray-800": !disabled,
              },
            )}
          >
            {leadingText}
          </div>
        ) : null}

        <input
          {...props}
          type={type}
          value={value}
          placeholder={placeholder}
          aria-label="input"
          className={classNames(
            "w-full select-none text-gray-900 dark:text-white text-md border h-11 focus:outline-none",
            {
              "pl-9": LeadingIcon,
              "pl-2": !LeadingIcon,
              "pr-9": TrailingIcon,
              "pr-2": !TrailingIcon,
              "rounded-l-0 rounded-r-lg": leadingText,
              "rounded-lg": !leadingText,
              "border-gray-300 dark:border-gray-500 focus:ring-2 focus:border-primary-300 dark:focus:border-gray-100 focus:ring-primary-100 dark:focus:ring-gray-100 dark:focus:ring-opacity-20":
                !error,
              "border-error-400 focus:ring-2 focus:border-error-400 focus:ring-error-500":
                error,
              "bg-white dark:bg-gray-800": !disabled,
              "bg-gray-50 dark:bg-gray-700": disabled,
            },
          )}
          disabled={disabled}
        />
      </div>

      {error && typeof error === "string" ? (
        <div className="mt-1.5 text-error-500 text-sm">{error}</div>
      ) : null}

      {helperText ? (
        <div className="mt-1.5 text-gray-500 text-sm">{helperText}</div>
      ) : null}
    </div>
  );
};
