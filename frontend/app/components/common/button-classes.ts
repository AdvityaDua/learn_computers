export const buttonClasses = {
  base: "inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.01em] transition disabled:cursor-not-allowed disabled:opacity-70",
  size: {
    xs: "h-9.5 px-4 text-[0.95rem]",
    sm: "h-10 px-4 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-sm",
  },
  variant: {
    primary: "btn-primary",
    outline: "btn-outline",
    google: "btn-google",
  },
  width: {
    full: "w-full",
  },
  header: "header-action-btn",
};

export function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
