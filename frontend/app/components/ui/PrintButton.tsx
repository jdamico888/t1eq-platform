"use client";

import Button from "./Button";

type Props = {
  label?: string;
};

export default function PrintButton({
  label = "Print",
}: Props) {

  function handlePrint() {
    window.print();
  }

  return (
    <Button onClick={handlePrint}>
      {label}
    </Button>
  );
}