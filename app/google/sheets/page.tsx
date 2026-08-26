"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet, Loader2, AlertCircle, RefreshCw,
  Plus, ExternalLink, Table2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  googleApi,
  type GoogleStatus,
  type GoogleSheet,
} from "@/lib/google-api";

export default function GoogleSheetsPage() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [sheets, setSheets] = useState<GoogleSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await googleApi.getStatus();
      setStatus(s);
      if (s.connected && s.services.sheets) {
        const sheetList = await googleApi.getSheets();
        setSheets(sheetList);
        if (sheetList.length > 0 && !selectedSheet) {
          setSelectedSheet(sheetList[0].id);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [selectedSheet]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const fetchSheetData = useCallback(async () => {
    if (!selectedSheet) return;
    setFetching(true);
    setError(null);
    try {
      const data = await googleApi.readSheet(selectedSheet);
      setSheetData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read sheet");
    } finally {
      setFetching(false);
    }
  }, [selectedSheet]);

  useEffect(() => {
    if (selectedSheet) {
      fetchSheetData();
    }
  }, [selectedSheet, fetchSheetData]);

  const handleCreateSheet = async () => {
    setCreating(true);
    setError(null);
    setMsg(null);
    try {
      const result = await googleApi.createTaskSheet("QuasarAISEO Tasks");
      setMsg(`Created new sheet successfully!`);
      await fetchStatus();
      setSelectedSheet(result.spreadsheetId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create sheet");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <DashboardLayout>
          <div className="px-6 py-8 lg:px-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-8 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-1.5 h-3 w-56" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </RequireAuth>
    );
  }

  if (!status?.connected || !status.services.sheets) {
    return (
      <RequireAuth>
        <DashboardLayout>
          <div className="mx-auto max-w-2xl px-6 py-16 text-center">
            <FileSpreadsheet className="mx-auto size-12 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Google Sheets Not Connected
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Connect your Google account in Settings to view and manage Google Sheets.
            </p>
            <Button className="mt-6" onClick={() => (window.location.href = "/setting")}>
              Go to Settings
            </Button>
          </div>
        </DashboardLayout>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="px-6 py-8 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Google Sheets
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View and manage your Google Sheets spreadsheets
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchSheetData} disabled={fetching || !selectedSheet}>
                <RefreshCw className={`size-4 ${fetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={handleCreateSheet} disabled={creating}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                New Sheet
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {msg && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 text-sm font-semibold text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-400">
              <FileSpreadsheet className="size-4 shrink-0" />
              {msg}
            </div>
          )}

          {/* Sheet selector */}
          {sheets.length > 0 && (
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Spreadsheet
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                {sheets.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sheets list cards */}
          {sheets.length > 0 && (
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sheets.map(s => (
                <div
                  key={s.id}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${selectedSheet === s.id ? "border-fuchsia-400 bg-fuchsia-50/30 dark:bg-fuchsia-400/5" : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/50"}`}
                  onClick={() => setSelectedSheet(s.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-400/10 dark:text-fuchsia-400">
                      <FileSpreadsheet className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Modified {new Date(s.modifiedTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sheet data table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Table2 className="size-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sheet Data
                </h2>
              </div>
              <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {sheetData.length > 0 ? `${sheetData.length - 1} rows` : "Empty"}
              </Badge>
            </div>
            {fetching ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-fuchsia-500" />
              </div>
            ) : sheetData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5">
                      {sheetData[0]?.map((header, i) => (
                        <th
                          key={i}
                          className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400"
                        >
                          {header || `Column ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {sheetData.slice(1).map((row, i) => (
                      <tr
                        key={i}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        {sheetData[0]?.map((_, j) => (
                          <td
                            key={j}
                            className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300"
                          >
                            {row[j] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                {selectedSheet ? "This sheet is empty." : "Select a spreadsheet to view data."}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}
