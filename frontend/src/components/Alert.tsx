import { FC } from "react";
import classNames from "classnames";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";

type AlertSeverity = "primary" | "success" | "info" | "warning" | "error";
type AlertVariant = "filled" | "outlined";
type AlertSize = "sm" | "md" | "lg" | "xl" | "2xl";

const AlertSeverityClasses: Record<
  AlertSeverity,
  Record<AlertVariant, string>
> = {
  primary: {
    filled: "alert-primary",
    outlined: "alert-primary-outlined",
  },
  success: {
    filled: "alert-success",
    outlined: "alert-success-outlined",
  },
  info: {
    filled: "alert-info",
    outlined: "alert-info-outlined",
  },
  warning: {
    filled: "alert-warning",
    outlined: "alert-warning-outlined",
  },
  error: {
    filled: "alert-error",
    outlined: "alert-error-outlined",
  },
};

const AlertSeverityIconClasses: Record<AlertSeverity, JSX.Element> = {
  primary: <FiInfo />,
  success: <FiCheckCircle />,
  info: <FiInfo />,
  warning: <FiAlertTriangle />,
  error: <FiAlertCircle />,
};

const AlertSizeClasses: Record<AlertSize, string> = {
  sm: "alert-sm",
  md: "alert-md",
  lg: "alert-lg",
  xl: "alert-xl",
  "2xl": "alert-2xl",
};

export interface AlertProps {
  children?: React.ReactElement | string;
  className?: string;
  severity?: AlertSeverity;
  variant?: AlertVariant;
  size?: AlertSize;
  TrailingIcon?: React.ReactElement;
  LeadingIcon?: React.ReactElement;
}

export const Alert: FC<AlertProps> = ({
  children,
  className,
  severity = "primary",
  variant = "filled",
  size = "md",
  TrailingIcon,
  LeadingIcon,
}) => {
  const AlertSeverityClassName = AlertSeverityClasses[severity];
  const AlertVariantClassName = AlertSeverityClassName[variant];
  const AlertSeverityIconClassName = AlertSeverityIconClasses[severity];
  return (
    <div
      className={classNames(
        "alert-base",
        className,
        AlertSizeClasses[size],
        AlertVariantClassName
      )}
    >
      {LeadingIcon ? (
        <LeadingIcon.type
          {...LeadingIcon.props}
          className={classNames(LeadingIcon.props.className)}
        />
      ) : (
        AlertSeverityIconClassName
      )}
      {children}
      {TrailingIcon ? (
        <TrailingIcon.type
          {...TrailingIcon.props}
          className={classNames(TrailingIcon.props.className)}
        />
      ) : null}
    </div>
  );
};