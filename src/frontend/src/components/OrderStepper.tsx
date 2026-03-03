import { CheckCircle2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { OrderStatus } from "../backend.d";

const STEPS = [
  { label: "Order Placed", key: "placed" },
  { label: "Confirmed", key: "confirmed" },
  { label: "Shipped", key: "shipped" },
  { label: "Out for Delivery", key: "out_for_delivery" },
  { label: "Delivered", key: "delivered" },
];

// Map backend status → active step index (0-based)
function getActiveStep(status: OrderStatus | string): number {
  switch (status) {
    case OrderStatus.pending:
      return 0;
    case OrderStatus.confirmed:
      return 1;
    case "shipped":
      return 2;
    case "out_for_delivery":
      return 3;
    case OrderStatus.delivered:
      return 4;
    default:
      return 0;
  }
}

function isCancelled(status: OrderStatus | string): boolean {
  return status === OrderStatus.cancelled || status === "cancelled";
}

interface OrderStepperProps {
  status: OrderStatus | string;
  compact?: boolean;
}

export default function OrderStepper({
  status,
  compact = false,
}: OrderStepperProps) {
  const cancelled = isCancelled(status);
  const activeStep = cancelled ? -1 : getActiveStep(status);

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 py-3">
        <XCircle className="h-5 w-5 text-destructive shrink-0" />
        <span className="font-display font-semibold text-sm text-destructive">
          Order Cancelled
        </span>
        <div className="flex-1 h-px bg-border ml-2" />
        <div className="flex gap-1.5">
          {STEPS.map((step) => (
            <div
              key={step.key}
              className="h-2 w-2 rounded-full bg-muted"
              title={step.label}
            />
          ))}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const done = idx < activeStep;
          const current = idx === activeStep;
          return (
            <div key={step.key} className="flex items-center gap-1">
              <div
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  done
                    ? "bg-ocean-blue"
                    : current
                      ? "bg-ocean-blue ring-2 ring-ocean-blue/30"
                      : "bg-border"
                }`}
                title={step.label}
              />
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-px w-4 transition-all ${done ? "bg-ocean-blue" : "bg-border"}`}
                />
              )}
            </div>
          );
        })}
        <span className="ml-2 text-xs font-display font-medium text-foreground">
          {STEPS[activeStep]?.label}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-center w-full">
        {STEPS.map((step, idx) => {
          const done = idx < activeStep;
          const current = idx === activeStep;
          const future = idx > activeStep;

          return (
            <div
              key={step.key}
              className="flex items-center flex-1 last:flex-none"
            >
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  {done ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-9 w-9 rounded-full bg-ocean-blue flex items-center justify-center shadow-ocean"
                    >
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </motion.div>
                  ) : current ? (
                    <div className="relative h-9 w-9">
                      <div className="absolute inset-0 rounded-full bg-ocean-blue/20 animate-ping" />
                      <div className="relative h-9 w-9 rounded-full bg-ocean-blue flex items-center justify-center shadow-ocean">
                        <span className="text-white font-heading font-bold text-sm">
                          {idx + 1}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`h-9 w-9 rounded-full border-2 flex items-center justify-center transition-all ${
                        future
                          ? "border-border bg-background"
                          : "border-border bg-muted"
                      }`}
                    >
                      <span
                        className={`font-heading font-semibold text-sm ${
                          future ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-display text-center leading-tight max-w-16 ${
                    done || current
                      ? "text-ocean-blue font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-1 mt-[-18px]">
                  <div
                    className={`h-0.5 w-full transition-all duration-500 ${
                      done ? "bg-ocean-blue" : "bg-border"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical stepper */}
      <div className="flex sm:hidden flex-col gap-0">
        {STEPS.map((step, idx) => {
          const done = idx < activeStep;
          const current = idx === activeStep;

          return (
            <div key={step.key} className="flex items-start gap-3">
              {/* Left: circle + vertical line */}
              <div className="flex flex-col items-center">
                {done ? (
                  <div className="h-7 w-7 rounded-full bg-ocean-blue flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                ) : current ? (
                  <div className="relative h-7 w-7 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-ocean-blue/20 animate-ping" />
                    <div className="relative h-7 w-7 rounded-full bg-ocean-blue flex items-center justify-center">
                      <span className="text-white font-heading font-bold text-xs">
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full border-2 border-border bg-background flex items-center justify-center shrink-0">
                    <span className="text-muted-foreground font-heading text-xs">
                      {idx + 1}
                    </span>
                  </div>
                )}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-6 mt-0.5 transition-all ${
                      done ? "bg-ocean-blue" : "bg-border"
                    }`}
                  />
                )}
              </div>

              {/* Right: label */}
              <div className="pb-6 pt-0.5">
                <span
                  className={`text-sm font-display ${
                    done || current
                      ? "text-ocean-blue font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {current && (
                  <span className="ml-2 text-xs bg-ocean-blue/10 text-ocean-blue font-display px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
