"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2, AlertCircle, Globe, Plus, Link2, Check,
  ExternalLink, Trash2, RefreshCw, FileText, Clock,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RequireAuth } from "@/components/auth/require-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  wordpressApi,
  type WordPressSite,
} from "@/lib/wordpress-api";

function WordPressContent() {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [token, setToken] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlFromQuery = searchParams.get("siteUrl");
    const tokenFromQuery = searchParams.get("token");
    if (urlFromQuery) setSiteUrl(decodeURIComponent(urlFromQuery));
    if (tokenFromQuery) setToken(decodeURIComponent(tokenFromQuery));
    if (urlFromQuery || tokenFromQuery) {
      setShowConnectForm(true);
    }
  }, [searchParams]);

  const fetchSites = useCallback(async () => {
    try {
      const s = await wordpressApi.getSites();
      setSites(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleConnect = async () => {
    if (!siteUrl || !token) return;
    setConnecting(true);
    setError(null);
    try {
      await wordpressApi.connectSite(siteUrl, token);
      setSiteUrl("");
      setToken("");
      setShowConnectForm(false);
      await fetchSites();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (url: string) => {
    if (!confirm("Disconnect this WordPress site?")) return;
    try {
      await wordpressApi.disconnectSite(url);
      await fetchSites();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect");
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <DashboardLayout>
          <div className="px-6 py-8 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-2 h-4 w-72" />
              </div>
              <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-2 h-3 w-48" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
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
                WordPress Sites
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Connect your WordPress sites to publish AI-generated content
              </p>
            </div>
            <Button onClick={() => setShowConnectForm(!showConnectForm)}>
              <Plus className="size-4" />
              Connect Site
            </Button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Connect form */}
          {showConnectForm && (
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/50">
              <div className="mb-4 flex items-center gap-2">
                <Link2 className="size-5 text-fuchsia-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Connect WordPress Site
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                    WordPress Site URL
                  </label>
                  <Input
                    placeholder="https://your-site.com"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                    Connection Token
                  </label>
                  <Input
                    placeholder="Token from Quasar AI SEO plugin settings"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Find the token in your WordPress admin under Quasar AI SEO → Settings
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleConnect} disabled={connecting || !siteUrl || !token}>
                    {connecting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {connecting ? "Connecting..." : "Connect"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowConnectForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Sites list */}
          {sites.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center dark:border-white/10 dark:bg-slate-900/50">
              <Globe className="mx-auto size-12 text-slate-300 dark:text-slate-600" />
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                No WordPress Sites Connected
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Install the Quasar AI SEO Assistant plugin on your WordPress site and connect it here.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <Button onClick={() => setShowConnectForm(true)}>
                  <Plus className="size-4" />
                  Connect Your First Site
                </Button>
                <a
                  href="https://github.com/Quasar-Dev-Co/quasaraiseo/tree/main/wordpress-plugin/quasar-ai-seo-assistant"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-fuchsia-500 hover:underline"
                >
                  Download the WordPress Plugin →
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                    <Globe className="size-4" /> Connected Sites
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {sites.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                    <FileText className="size-4" /> Total Posts
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {sites.reduce((sum, s) => sum + s.postCount, 0)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                    <Check className="size-4" /> Active
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {sites.filter((s) => s.connected).length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                    <Clock className="size-4" /> Last Sync
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    {sites[0]?.lastSyncAt
                      ? new Date(sites[0].lastSyncAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Never"}
                  </div>
                </div>
              </div>

              {/* Sites table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Connected WordPress Sites
                  </h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site) => (
                      <TableRow key={site.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="size-4 text-slate-400" />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {site.siteName || site.siteUrl}
                              </div>
                              <a
                                href={site.siteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-400 hover:text-fuchsia-500"
                              >
                                {site.siteUrl} <ExternalLink className="inline size-3" />
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {site.connected ? (
                            <Badge className="bg-green-100 text-green-700">Connected</Badge>
                          ) : (
                            <Badge variant="secondary">Disconnected</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-white">
                          {site.postCount}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {site.lastSyncAt
                            ? new Date(site.lastSyncAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => (window.location.href = `/post-create?siteId=${site.id}`)}
                            >
                              <FileText className="size-3.5" /> New Post
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisconnect(site.siteUrl)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Recent posts across all sites */}
              {sites.some((s) => s.recentPosts.length > 0) && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Recent Posts
                    </h2>
                    <Button size="sm" variant="ghost" onClick={fetchSites}>
                      <RefreshCw className="size-3.5" /> Refresh
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites.flatMap((site) =>
                        site.recentPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-semibold text-slate-900 dark:text-white max-w-[300px] truncate">
                              {post.permalink ? (
                                <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="hover:text-fuchsia-500">
                                  {post.title}
                                </a>
                              ) : (
                                post.title
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">{site.siteName || site.siteUrl}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  post.status === "publish"
                                    ? "bg-green-100 text-green-700"
                                    : post.status === "future"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-orange-100 text-orange-700"
                                }
                              >
                                {post.status === "publish" ? "Published" : post.status === "future" ? "Scheduled" : "Draft"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </TableCell>
                          </TableRow>
                        )),
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-400/20 dark:bg-blue-400/5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              How to connect your WordPress site
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>1.</strong> Download the Quasar AI SEO Assistant plugin</li>
              <li><strong>2.</strong> Install and activate it on your WordPress site (Plugins → Add New → Upload)</li>
              <li><strong>3.</strong> Go to Quasar AI SEO in your WordPress admin menu</li>
              <li><strong>4.</strong> Click "Connect to Quasar AI SEO" — it opens this page with the token pre-filled</li>
              <li><strong>5.</strong> Click Connect here to complete the connection</li>
            </ol>
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}

export default function WordPressPage() {
  return (
    <Suspense fallback={<RequireAuth><DashboardLayout><div className="flex h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-fuchsia-500" /></div></DashboardLayout></RequireAuth>}>
      <WordPressContent />
    </Suspense>
  );
}
