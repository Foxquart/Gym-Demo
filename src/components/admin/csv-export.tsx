"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function escapeCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Client-side CSV download. The rows are already filtered by the server, so
 * what the admin sees is exactly what lands in the file.
 */
export function CsvExportButton({
  filename,
  headers,
  rows,
  label = "Export CSV",
}: {
  filename: string;
  headers: string[];
  rows: (string | number | null)[][];
  label?: string;
}) {
  const download = React.useCallback(() => {
    if (rows.length === 0) {
      toast.error("Nothing to export with these filters.");
      return;
    }
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
    // The BOM keeps Excel from mangling ₹ and non-ASCII names.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length.toLocaleString("en-IN")} rows exported.`);
  }, [filename, headers, rows]);

  return (
    <Button variant="outline" size="sm" onClick={download}>
      <Download className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
