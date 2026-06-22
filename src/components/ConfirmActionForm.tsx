"use client";

import type { ReactNode } from "react";

interface ConfirmActionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  message: string;
}

export default function ConfirmActionForm({
  action,
  children,
  message,
}: ConfirmActionFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
