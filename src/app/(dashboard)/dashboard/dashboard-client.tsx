"use client";

import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ScrollText, ShoppingCart, Activity,
  Type, Image as ImageIcon, CheckCircle2, Wand2,
} from "lucide-react";
import Link from "next/link";

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Processed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Completed: "bg-green-500/10 text-green-400 border-green-500/20",
    Failed:    "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const labels: Record<string, string> = {
    Processed: "Diproses", Completed: "Selesai", Failed: "Gagal",
  };
  return (
    <Badge variant="outline" className={colors[status] || ""}>
      {labels[status] || status}
    </Badge>
  );
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    year: "numeric", month: "short", day: "numeric",
  });

interface Roll {
  id: string; rollName: string; heightCm: string;
  quantity: number; status: string; createdAt: string;
}

interface Transaction {
  id: string; quantity: number | null; numberOfDetails: number | null;
  status: string; createdAt: string; transactionDate: string;
  roll: { rollName: string };
}

interface Props {
  userName: string; userRole: string;
  totalRolls: number; totalTransactions: number;
  totalFonts: number; totalBackgrounds: number;
  completedTransactions: number;
  recentRolls: Roll[];
  recentTransactions: Transaction[];
}

export function DashboardClient({
  userName, totalRolls, totalTransactions,
  totalFonts, totalBackgrounds, completedTransactions,
  recentRolls, recentTransactions,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-slate-400">
          Selamat datang, <span className="text-white font-medium">{userName}</span> 👋
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link href="/roll">
          <Card className="border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Roll</CardTitle>
              <div className="rounded-lg bg-blue-500/10 p-1.5">
                <ScrollText className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalRolls}</div>
              <p className="text-xs text-slate-500 mt-1">Roll tersedia</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/transaksi">
          <Card className="border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Transaksi</CardTitle>
              <div className="rounded-lg bg-purple-500/10 p-1.5">
                <ShoppingCart className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalTransactions}</div>
              <p className="text-xs text-slate-500 mt-1">Semua transaksi</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/transaksi?status=Completed">
          <Card className="border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Label Selesai</CardTitle>
              <div className="rounded-lg bg-green-500/10 p-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{completedTransactions}</div>
              <p className="text-xs text-slate-500 mt-1">Siap diunduh</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/materials/font">
          <Card className="border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Font</CardTitle>
              <div className="rounded-lg bg-yellow-500/10 p-1.5">
                <Type className="h-4 w-4 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalFonts}</div>
              <p className="text-xs text-slate-500 mt-1">Font tersedia</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/materials/background">
          <Card className="border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Background</CardTitle>
              <div className="rounded-lg bg-pink-500/10 p-1.5">
                <ImageIcon className="h-4 w-4 text-pink-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalBackgrounds}</div>
              <p className="text-xs text-slate-500 mt-1">Plat tersedia</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Action Banner */}
      <Card className="border-slate-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/20 p-2.5">
                <Wand2 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Buat Label Baru</p>
                <p className="text-xs text-slate-400">Pergi ke Transaksi → Tambah Transaksi → Input nama → Generate</p>
              </div>
            </div>
            <Link href="/transaksi">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30 cursor-pointer px-3 py-1.5">
                Mulai →
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Rolls */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-blue-400" /> Roll Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRolls.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Belum ada data roll</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Nama Roll</TableHead>
                    <TableHead className="text-slate-400">Tinggi</TableHead>
                    <TableHead className="text-slate-400">Qty</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRolls.map((roll) => (
                    <TableRow key={roll.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="font-medium text-white">{roll.rollName}</TableCell>
                      <TableCell className="text-slate-300">{roll.heightCm} cm</TableCell>
                      <TableCell className="text-slate-300">{roll.quantity}</TableCell>
                      <TableCell>{statusBadge(roll.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" /> Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Belum ada data transaksi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Roll</TableHead>
                    <TableHead className="text-slate-400">Detail</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="font-medium text-white">{tx.roll?.rollName || "-"}</TableCell>
                      <TableCell className="text-slate-300">
                        {tx.numberOfDetails
                          ? <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">{tx.numberOfDetails} nama</Badge>
                          : <span className="text-slate-600">—</span>}
                      </TableCell>
                      <TableCell>{statusBadge(tx.status)}</TableCell>
                      <TableCell className="text-slate-400 text-xs whitespace-nowrap">{formatDate(tx.transactionDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
