"use client";

import { Check, DollarSign, ImagePlus, Percent, Save, ShieldCheck, ShoppingBag, Utensils, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import {
  RESTAURANT_NAME_MAX_LENGTH,
  TAX_REGIME_PRESETS,
  TAX_REGIMES,
  type TaxMode,
  type TaxRegime,
} from "@nodedr-restaurant/types";
import { KioskCard } from "@/components/settings/kiosk-card";
import { PrinterDiagnosticsCard } from "@/components/settings/printer-diagnostics-card";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useBranch } from "@/hooks/use-branch";
import { useNotificationMute } from "@/hooks/use-notification-mute";
import {
  useSettings,
  useUpdateBranchSettings,
  useUpdateRestaurantSettings,
  useUploadRestaurantLogo,
  type BranchSettings,
  type RestaurantSettings,
} from "@/hooks/use-settings";
import { ApiError } from "@/lib/api";
import { formatCurrency, getCurrencySymbol } from "@/lib/format";

export default function SettingsPage() {
  const { branchId } = useBranch();
  const { data, isLoading } = useSettings(branchId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your restaurant brand, branch details, tax and hardware</p>
        </div>
      </div>

      <SettingsTabs />

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-md" />
          <Skeleton className="h-72 rounded-md" />
        </div>
      ) : (
        <GeneralSettingsForm
          key={`${data.restaurant.id}-${data.branch.id}-${data.restaurant.name}-${data.branch.name}-${data.restaurant.logoUrl}`}
          restaurant={data.restaurant}
          branch={data.branch}
          branchId={branchId}
        />
      )}

      {data && (
        <OnlineOrdersCard
          key={`online-${data.restaurant.id}-${data.branch.id}`}
          branchId={branchId}
          branch={data.branch}
          restaurant={data.restaurant}
        />
      )}

      {data && <KioskCard key={`kiosk-${data.branch.id}`} branchId={branchId} branch={data.branch} />}

      <NotificationSettingsCard />

      <PrinterDiagnosticsCard />

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/40">
        <span>OrderRestro Enterprise POS · Offline-First Architecture</span>
        <a
          className="hover:text-foreground hover:underline transition-colors font-mono text-[11px]"
          href="https://github.com/Syxd09/restaurant-pos-system"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/Syxd09/restaurant-pos-system
        </a>
      </div>
    </div>
  );
}

function OnlineOrdersCard({
  branchId,
  branch,
  restaurant,
}: {
  branchId: string | null;
  branch: BranchSettings;
  restaurant: RestaurantSettings;
}) {
  const updateBranch = useUpdateBranchSettings(branchId);
  const updateRestaurant = useUpdateRestaurantSettings(branchId);

  const [autoOrders, setAutoOrders] = useState(branch.autoConfirmOrders);
  const [autoBookings, setAutoBookings] = useState(branch.autoConfirmReservations);
  const [minOrder, setMinOrder] = useState(String(Number(restaurant.onlineMinOrderAmount ?? 0)));
  const initialAdj = Number(restaurant.onlinePriceAdjustValue ?? 0);
  const [adjustKind, setAdjustKind] = useState<"PERCENT" | "AMOUNT">(restaurant.onlinePriceAdjustKind ?? "PERCENT");
  const [adjustDir, setAdjustDir] = useState<"cheaper" | "costlier">(initialAdj < 0 ? "cheaper" : "costlier");
  const [adjustValue, setAdjustValue] = useState(String(Math.abs(initialAdj)));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAutoOrders(branch.autoConfirmOrders);
    setAutoBookings(branch.autoConfirmReservations);
    setMinOrder(String(Number(restaurant.onlineMinOrderAmount ?? 0)));
    const adj = Number(restaurant.onlinePriceAdjustValue ?? 0);
    setAdjustKind(restaurant.onlinePriceAdjustKind ?? "PERCENT");
    setAdjustDir(adj < 0 ? "cheaper" : "costlier");
    setAdjustValue(String(Math.abs(adj)));
  }, [branch, restaurant]);

  const currencySymbol = getCurrencySymbol(restaurant.currency);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const val = (adjustDir === "cheaper" ? -1 : 1) * Math.abs(Number(adjustValue) || 0);
      await Promise.all([
        updateBranch.mutateAsync({
          autoConfirmOrders: autoOrders,
          autoConfirmReservations: autoBookings,
        }),
        updateRestaurant.mutateAsync({
          onlineMinOrderAmount: Math.max(Number(minOrder) || 0, 0),
          onlinePriceAdjustKind: adjustKind,
          onlinePriceAdjustValue: val,
        }),
      ]);
      toast.success("Online order preferences and pricing saved successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save online order settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Preview computation
  const sampleBase = 100;
  const numAdj = Math.abs(Number(adjustValue) || 0);
  const previewPrice =
    adjustDir === "cheaper"
      ? adjustKind === "PERCENT"
        ? sampleBase * (1 - numAdj / 100)
        : Math.max(sampleBase - numAdj, 0)
      : adjustKind === "PERCENT"
        ? sampleBase * (1 + numAdj / 100)
        : sampleBase + numAdj;

  return (
    <Card className="flex flex-col gap-5 p-6 rounded-lg border border-border/80">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-semibold text-foreground">Online Orders &amp; Digital Menu Catalog</h2>
        <p className="text-sm text-muted-foreground">
          Configure how orders and table bookings from your customer QR portal and website are accepted and priced.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4 bg-secondary/20">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="auto-confirm-orders" className="text-sm font-medium">Auto-confirm online orders</Label>
            <p className="text-xs text-muted-foreground">
              Off = rings and waits for staff approval. On = dispatched directly to kitchen KDS.
            </p>
          </div>
          <Switch
            id="auto-confirm-orders"
            checked={autoOrders}
            disabled={isSaving}
            onCheckedChange={setAutoOrders}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4 bg-secondary/20">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="auto-confirm-bookings" className="text-sm font-medium">Auto-confirm table bookings</Label>
            <p className="text-xs text-muted-foreground">
              Off = wait for staff confirmation. On = immediately reserved for free tables.
            </p>
          </div>
          <Switch
            id="auto-confirm-bookings"
            checked={autoBookings}
            disabled={isSaving}
            onCheckedChange={setAutoBookings}
          />
        </div>
      </div>

      {/* Online Pricing & Minimum Order */}
      <div className="flex flex-col gap-4 border-t border-border/60 pt-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Online &amp; QR Pricing Adjustments</h3>
          <p className="text-xs text-muted-foreground">
            Adjust menu prices specifically for online and table QR orders (e.g. commission markup or promo discount).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="online-min-order" className="text-xs font-medium">Minimum Order Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">{currencySymbol}</span>
              <Input
                id="online-min-order"
                type="number"
                min="0"
                step="1"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="h-9 text-xs"
                placeholder="0 = no minimum"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Orders below this cannot be placed online.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Adjustment Direction</Label>
            <Select value={adjustDir} onValueChange={(v) => setAdjustDir(v as "cheaper" | "costlier")}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="costlier" className="text-xs">+ Markup (Online items cost more)</SelectItem>
                <SelectItem value="cheaper" className="text-xs">− Discount (Online items cost less)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="online-adjust-val" className="text-xs font-medium">Adjustment Rate</Label>
            <div className="flex items-center gap-2">
              <Select value={adjustKind} onValueChange={(v) => setAdjustKind(v as "PERCENT" | "AMOUNT")}>
                <SelectTrigger className="h-9 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT" className="text-xs">Percent (%)</SelectItem>
                  <SelectItem value="AMOUNT" className="text-xs">Flat ({currencySymbol})</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="online-adjust-val"
                type="number"
                min="0"
                step={adjustKind === "PERCENT" ? "1" : "0.5"}
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                className="h-9 text-xs font-semibold"
                placeholder="0"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {numAdj > 0
                ? `Live Preview: A ${formatCurrency(100)} dish sells for ${formatCurrency(previewPrice)} online`
                : "No adjustment (standard dine-in prices apply)"}
            </p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving || updateBranch.isPending || updateRestaurant.isPending}
        className="self-start h-9 text-xs font-semibold shadow-xs"
      >
        {isSaving ? "Saving Online Settings…" : "Save Online Order Settings"}
      </Button>
    </Card>
  );
}

function NotificationSettingsCard() {
  const [muted, toggleMuted] = useNotificationMute();

  return (
    <Card className="flex flex-col gap-4 p-6 rounded-lg border border-border/80">
      <div>
        <h2 className="text-[18px] font-semibold text-foreground">Audio &amp; Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Audible alerts for new orders, table reservations, and incoming kitchen tickets.
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4 bg-secondary/20">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="notification-sound" className="text-sm font-medium">Terminal notification chime</Label>
          <p className="text-xs text-muted-foreground">
            Plays an audio chime when new orders or KDS tickets arrive. This setting is stored per device/browser.
          </p>
        </div>
        <Switch
          id="notification-sound"
          checked={!muted}
          onCheckedChange={() => {
            toggleMuted();
            toast.success(!muted ? "Sound chime disabled" : "Sound chime enabled");
          }}
        />
      </div>
    </Card>
  );
}

function GeneralSettingsForm({
  restaurant,
  branch,
  branchId,
}: {
  restaurant: RestaurantSettings;
  branch: BranchSettings;
  branchId: string | null;
}) {
  // Restaurant State
  const [name, setName] = useState(restaurant.name);
  const [legalName, setLegalName] = useState(restaurant.legalName ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(restaurant.logoUrl);
  const [currency, setCurrency] = useState(restaurant.currency);
  const [timezone, setTimezone] = useState(restaurant.timezone);
  const [upiVpa, setUpiVpa] = useState(restaurant.upiVpa ?? "");
  const [upiPayeeName, setUpiPayeeName] = useState(restaurant.upiPayeeName ?? "");
  const [loyaltyPointValue, setLoyaltyPointValue] = useState(restaurant.loyaltyPointValue);
  const [loyaltyEarnPerCurrency, setLoyaltyEarnPerCurrency] = useState(
    String(restaurant.loyaltyEarnPerCurrency),
  );
  const [referralEnabled, setReferralEnabled] = useState(!!restaurant.referralEnabled);
  const [referralSharerPoints, setReferralSharerPoints] = useState(String(restaurant.referralSharerPoints ?? 15));
  const [referralReferredPoints, setReferralReferredPoints] = useState(String(restaurant.referralReferredPoints ?? 10));
  const [referralMinPurchase, setReferralMinPurchase] = useState(String(Number(restaurant.referralMinPurchase ?? 200)));
  const [maxDiscount, setMaxDiscount] = useState(String(Number(restaurant.maxManualDiscountPercent ?? 100)));
  const [requireReason, setRequireReason] = useState(!!restaurant.requireDiscountReason);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uploadLogo = useUploadRestaurantLogo();

  // Branch State
  const [branchName, setBranchName] = useState(branch.name);
  const [address, setAddress] = useState(branch.address ?? "");
  const [phone, setPhone] = useState(branch.phone ?? "");
  const [gstNumber, setGstNumber] = useState(branch.gstNumber ?? "");
  const [country, setCountry] = useState(branch.country);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(branch.taxRegime);
  const [taxMode, setTaxMode] = useState<TaxMode>(branch.taxMode);
  const [taxLabel, setTaxLabel] = useState(branch.taxLabel ?? "");
  const [taxId, setTaxId] = useState(branch.taxId ?? "");

  const preset = TAX_REGIME_PRESETS[taxRegime];

  const updateRestaurant = useUpdateRestaurantSettings(branchId);
  const updateBranch = useUpdateBranchSettings(branchId);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Sync internal state if server data refreshes
  useEffect(() => {
    setName(restaurant.name);
    setLegalName(restaurant.legalName ?? "");
    setLogoUrl(restaurant.logoUrl);
    setCurrency(restaurant.currency);
    setTimezone(restaurant.timezone);
    setUpiVpa(restaurant.upiVpa ?? "");
    setUpiPayeeName(restaurant.upiPayeeName ?? "");
    setLoyaltyPointValue(restaurant.loyaltyPointValue);
    setLoyaltyEarnPerCurrency(String(restaurant.loyaltyEarnPerCurrency));
    setReferralEnabled(!!restaurant.referralEnabled);
    setReferralSharerPoints(String(restaurant.referralSharerPoints ?? 15));
    setReferralReferredPoints(String(restaurant.referralReferredPoints ?? 10));
    setReferralMinPurchase(String(Number(restaurant.referralMinPurchase ?? 200)));
    setMaxDiscount(String(Number(restaurant.maxManualDiscountPercent ?? 100)));
    setRequireReason(!!restaurant.requireDiscountReason);

    setBranchName(branch.name);
    setAddress(branch.address ?? "");
    setPhone(branch.phone ?? "");
    setGstNumber(branch.gstNumber ?? "");
    setCountry(branch.country);
    setTaxRegime(branch.taxRegime);
    setTaxMode(branch.taxMode);
    setTaxLabel(branch.taxLabel ?? "");
    setTaxId(branch.taxId ?? "");
  }, [restaurant, branch]);

  const saveRestaurantData = async () => {
    return updateRestaurant.mutateAsync({
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      logoUrl,
      currency: currency.trim().toUpperCase(),
      timezone: timezone.trim(),
      upiVpa: upiVpa.trim() || null,
      upiPayeeName: upiPayeeName.trim() || null,
      loyaltyPointValue: Number(loyaltyPointValue) || 0,
      loyaltyEarnPerCurrency: Number(loyaltyEarnPerCurrency) || 1,
      referralEnabled,
      referralSharerPoints: Math.max(Math.floor(Number(referralSharerPoints) || 0), 0),
      referralReferredPoints: Math.max(Math.floor(Number(referralReferredPoints) || 0), 0),
      referralMinPurchase: Math.max(Number(referralMinPurchase) || 0, 0),
      maxManualDiscountPercent: Math.min(Math.max(Number(maxDiscount) || 0, 0), 100),
      requireDiscountReason: requireReason,
    });
  };

  const saveBranchData = async () => {
    return updateBranch.mutateAsync({
      name: branchName.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
      country: country.trim().slice(0, 2).toUpperCase() || preset.defaultCountry,
      taxRegime,
      taxMode,
      taxLabel: taxLabel.trim() || null,
      taxId: taxId.trim() || null,
    });
  };

  const onSubmitRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveRestaurantData();
      toast.success("Restaurant profile saved successfully!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save restaurant settings");
    }
  };

  const onSubmitBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveBranchData();
      toast.success("Branch details saved successfully!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save branch settings");
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      await Promise.all([saveRestaurantData(), saveBranchData()]);
      toast.success("All restaurant and branch settings saved successfully!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save settings. Please verify inputs.");
    } finally {
      setIsSavingAll(false);
    }
  };

  const onRegimeChange = (value: TaxRegime | null) => {
    if (!value) return;
    setTaxRegime(value);
    setTaxMode(TAX_REGIME_PRESETS[value].defaultMode);
    setCountry(TAX_REGIME_PRESETS[value].defaultCountry);
  };

  const removeLogo = () => {
    setLogoUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    updateRestaurant.mutate(
      { logoUrl: null },
      {
        onSuccess: () => toast.success("Logo removed successfully"),
        onError: () => toast.error("Could not remove logo"),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Unified Fast Save Bar */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-md border border-border/80 bg-card shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Save Configuration</span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Applies changes to restaurant name, currency, branch details, and tax policies
          </span>
        </div>
        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={isSavingAll || updateRestaurant.isPending || updateBranch.isPending}
          className="h-8 gap-1.5 text-xs font-bold shadow-xs"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSavingAll ? "Saving All…" : "Save All Settings"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Restaurant Settings */}
        <Card className="flex flex-col gap-4 p-6 rounded-lg border border-border/80">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h2 className="text-[18px] font-semibold text-foreground">Restaurant Profile</h2>
              <p className="text-xs text-muted-foreground">Brand identity, currency, UPI, and loyalty rewards</p>
            </div>
          </div>

          <form onSubmit={onSubmitRestaurant} className="flex flex-col gap-4">
            {/* Logo Upload */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium">Brand Logo</Label>
              <div className="flex items-center gap-4">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    uploadLogo.mutate(file, {
                      onSuccess: (res) => {
                        setLogoUrl(res.url);
                        // Auto-save logoUrl to restaurant immediately
                        updateRestaurant.mutate(
                          { logoUrl: res.url },
                          {
                            onSuccess: () => toast.success("Logo uploaded and saved to restaurant!"),
                            onError: () => toast.success("Logo uploaded. Click 'Save restaurant' to apply."),
                          },
                        );
                      },
                      onError: (err) =>
                        toast.error(err instanceof ApiError ? err.message : "Could not upload logo"),
                    });
                  }}
                />
                {logoUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="" className="h-full w-full object-contain" />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-xs bg-background/80 text-foreground hover:bg-background transition-colors"
                      aria-label="Remove logo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadLogo.isPending}
                    className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-[10px]">
                      {uploadLogo.isPending ? "Uploading…" : "Upload"}
                    </span>
                  </button>
                )}
                <p className="text-xs text-muted-foreground">
                  Displays in the app sidebar and login console. PNG or WebP with transparent background recommended.
                </p>
              </div>
            </div>

            {/* Restaurant Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-name" className="text-xs font-medium">Restaurant Brand Name *</Label>
              <Input
                id="r-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, RESTAURANT_NAME_MAX_LENGTH))}
                maxLength={RESTAURANT_NAME_MAX_LENGTH}
                required
                className="h-9 text-xs"
              />
              <p className="text-right text-[11px] text-muted-foreground">
                {name.length}/{RESTAURANT_NAME_MAX_LENGTH}
              </p>
            </div>

            {/* Legal Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-legal" className="text-xs font-medium">Legal / Registered Business Name</Label>
              <Input
                id="r-legal"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Acme Hospitality Pvt Ltd"
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Printed on official receipts, tax invoices, and legal compliance reports.</p>
            </div>

            {/* Currency & Timezone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="r-currency" className="text-xs font-medium">Currency Code *</Label>
                <Input
                  id="r-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  required
                  className="h-9 text-xs font-mono font-semibold"
                  placeholder="INR, USD, EUR, GBP, AED"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="r-timezone" className="text-xs font-medium">Timezone *</Label>
                <Input
                  id="r-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  required
                  className="h-9 text-xs"
                  placeholder="Asia/Kolkata, UTC, America/New_York"
                />
              </div>
            </div>

            {/* UPI & Digital Payment */}
            <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">UPI QR Payment Configuration</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="r-upi" className="text-xs font-medium">UPI ID (VPA)</Label>
                  <Input
                    id="r-upi"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="merchant@bank"
                    autoComplete="off"
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Scannable QR at POS till and customer display with dynamic bill amount.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="r-upi-name" className="text-xs font-medium">UPI Payee Display Name</Label>
                  <Input
                    id="r-upi-name"
                    value={upiPayeeName}
                    onChange={(e) => setUpiPayeeName(e.target.value)}
                    placeholder={name}
                    maxLength={60}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Loyalty Program */}
            <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loyalty &amp; Points Program</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="r-loyalty-earn" className="text-xs font-medium">Earn 1 point per spend</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{currency}</span>
                    <Input
                      id="r-loyalty-earn"
                      type="number"
                      min="1"
                      step="1"
                      value={loyaltyEarnPerCurrency}
                      onChange={(e) => setLoyaltyEarnPerCurrency(e.target.value)}
                      required
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="r-loyalty-value" className="text-xs font-medium">1 point redeems for</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{currency}</span>
                    <Input
                      id="r-loyalty-value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={loyaltyPointValue}
                      onChange={(e) => setLoyaltyPointValue(e.target.value)}
                      required
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Program */}
            <div className="flex flex-col gap-3 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Referral Rewards</h3>
                  <p className="text-[11px] text-muted-foreground">Reward loyal guests who invite friends to your restaurant</p>
                </div>
                <Switch
                  checked={referralEnabled}
                  onCheckedChange={setReferralEnabled}
                  aria-label="Toggle referral rewards"
                />
              </div>

              {referralEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-md border border-border/60 bg-secondary/15">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="r-ref-sharer" className="text-xs font-medium">Referrer Reward</Label>
                    <Input
                      id="r-ref-sharer"
                      type="number"
                      min="0"
                      value={referralSharerPoints}
                      onChange={(e) => setReferralSharerPoints(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="15 pts"
                    />
                    <p className="text-[10px] text-muted-foreground">Points for referring customer</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="r-ref-referred" className="text-xs font-medium">New Guest Reward</Label>
                    <Input
                      id="r-ref-referred"
                      type="number"
                      min="0"
                      value={referralReferredPoints}
                      onChange={(e) => setReferralReferredPoints(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="10 pts"
                    />
                    <p className="text-[10px] text-muted-foreground">Welcome points for new guest</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="r-ref-min" className="text-xs font-medium">Min Qualifying Spend</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-mono">{currency}</span>
                      <Input
                        id="r-ref-min"
                        type="number"
                        min="0"
                        value={referralMinPurchase}
                        onChange={(e) => setReferralMinPurchase(e.target.value)}
                        className="h-9 text-xs font-semibold"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">First order value required</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cashier Discount Limit */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border/60 pt-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="r-max-discount" className="text-xs font-medium">Highest cashier discount (%)</Label>
                <Input
                  id="r-max-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  className="h-9 text-xs font-semibold"
                />
                <p className="text-[11px] text-muted-foreground">Cap on manual cashier discounts at checkout.</p>
              </div>
              <label className="flex items-start gap-2 text-xs sm:pt-6 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded-xs"
                  checked={requireReason}
                  onChange={(e) => setRequireReason(e.target.checked)}
                />
                <span className="text-foreground font-medium">Require reason for all manual discounts</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={updateRestaurant.isPending}
              className="self-start mt-2 h-9 text-xs font-semibold shadow-xs"
            >
              {updateRestaurant.isPending ? "Saving Restaurant…" : "Save Restaurant Profile"}
            </Button>
          </form>
        </Card>

        {/* Right Column: Branch Settings */}
        <Card className="flex flex-col gap-4 p-6 rounded-lg border border-border/80">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h2 className="text-[18px] font-semibold text-foreground">Current Branch Details</h2>
              <p className="text-xs text-muted-foreground">Location, contact info, tax regime, and billing rules</p>
            </div>
          </div>

          <form onSubmit={onSubmitBranch} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b-name" className="text-xs font-medium">Branch Display Name *</Label>
              <Input
                id="b-name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                required
                className="h-9 text-xs font-semibold"
                placeholder="e.g. Main Outlet / Downtown"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b-address" className="text-xs font-medium">Physical Street Address</Label>
              <Input
                id="b-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Building, street, neighborhood"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-phone" className="text-xs font-medium">Branch Phone Number</Label>
                <Input
                  id="b-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-gst" className="text-xs font-medium">GSTIN / Tax Registration</Label>
                <Input
                  id="b-gst"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Tax Settings */}
            <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tax Regime &amp; Invoicing</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="b-tax-regime" className="text-xs font-medium">Tax System</Label>
                  <Select value={taxRegime} onValueChange={onRegimeChange}>
                    <SelectTrigger id="b-tax-regime" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_REGIMES.map((regime) => (
                        <SelectItem key={regime} value={regime} className="text-xs">
                          {TAX_REGIME_PRESETS[regime].displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="b-tax-mode" className="text-xs font-medium">Menu Pricing Mode</Label>
                  <Select value={taxMode} onValueChange={(v) => setTaxMode(v as TaxMode)}>
                    <SelectTrigger id="b-tax-mode" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCLUSIVE" className="text-xs">Tax-inclusive (menu price includes tax)</SelectItem>
                      <SelectItem value="EXCLUSIVE" className="text-xs">Tax-exclusive (tax added at billing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {preset.exampleRates} — configured per dish under the Menu catalog.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-country" className="text-xs font-medium">Country Code (2 letters) *</Label>
                <Input
                  id="b-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  className="h-9 text-xs font-mono font-semibold"
                  placeholder="IN, US, GB, ES"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="b-tax-id" className="text-xs font-medium">{TAX_REGIME_PRESETS[taxRegime].taxIdLabel}</Label>
                <Input
                  id="b-tax-id"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="h-9 text-xs font-mono"
                  placeholder="Official tax registration"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b-tax-label" className="text-xs font-medium">Receipt Tax Label Override (Optional)</Label>
              <Input
                id="b-tax-label"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
                placeholder={preset.taxLabel}
                className="h-9 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={updateBranch.isPending}
              className="self-start mt-2 h-9 text-xs font-semibold shadow-xs"
            >
              {updateBranch.isPending ? "Saving Branch…" : "Save Branch Details"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
