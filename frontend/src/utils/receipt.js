import { formatIDR } from "./format";

/** Normalisasi ke angka WA Indonesia (62…) untuk tautan wa.me */
export function normalizeWhatsAppPhone(input) {
  const d = String(input || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  if (d.length >= 9) return `62${d}`;
  return d;
}

/** Struk HTML untuk window.print — dioptimalkan printer termal (lebar mm) */
export function buildThermalReceiptHtml({
  storeName = "Toko",
  storeAddress = "",
  storePhone = "",
  footer = "",
  widthMm = 80,
  invoiceNo = "—",
  dateStr = "",
  lines = [],
  subtotal = 0,
  discountTotal = 0,
  taxPercent = 0,
  taxAmount = 0,
  additionalFee = 0,
  additionalFeeName = "Biaya Tambahan",
  grandTotal = 0,
  paidSum = 0,
  changeAmount = 0,
  payments = [],
}) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const lineRows = lines
    .map((c) => {
      const raw = Number(c.discount_amount || 0);
      const sub = Number(c.sell_price) * Number(c.qty);
      const net = sub - raw;
      const discHtml =
        raw > 0
          ? `<div class="small muted">${formatIDR(sub)} → <b>${formatIDR(net)}</b> (diskon ${formatIDR(raw)})</div>`
          : `<div>${formatIDR(net)}</div>`;
      return `<div class="item"><div class="row"><span class="nm">${esc(c.name)}</span></div>
        <div class="row"><span>${c.qty}x ${formatIDR(c.sell_price)}</span></div>${discHtml}</div>`;
    })
    .join("");

  const payRows =
    payments.length > 0
      ? payments
          .map(
            (p) =>
              `<div class="row"><span>${esc(p.method)}</span><span>${formatIDR(p.amount)}</span></div>`
          )
          .join("")
      : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Struk</title>
<style>
  @page { size: ${widthMm}mm auto; margin: 2mm; }
  html,body{margin:0;padding:0;font-family:system-ui,sans-serif;font-size:11px;}
  .wrap{max-width:${widthMm}mm;margin:0 auto;padding:4px;}
  .c{text-align:center;}
  .h{font-weight:700;font-size:13px;margin:4px 0;}
  .row{display:flex;justify-content:space-between;gap:4px;margin:2px 0;}
  .item{border-bottom:1px dashed #ccc;padding:4px 0;}
  .small{font-size:10px;}
  .muted{color:#555;}
  .tot{font-weight:700;font-size:12px;margin-top:8px;padding-top:6px;border-top:1px solid #000;}
  hr{border:none;border-top:1px dashed #999;margin:6px 0;}
</style></head><body><div class="wrap">
<div class="c h">${esc(storeName)}</div>
${storeAddress ? `<div class="c small">${esc(storeAddress)}</div>` : ""}
${storePhone ? `<div class="c small">${esc(storePhone)}</div>` : ""}
<hr/>
<div class="row small"><span>${esc(invoiceNo)}</span><span>${esc(dateStr)}</span></div>
<hr/>
${lineRows}
<div class="row"><span>Subtotal</span><span>${formatIDR(subtotal)}</span></div>
${discountTotal > 0 ? `<div class="row muted"><span>Diskon total</span><span>- ${formatIDR(discountTotal)}</span></div>` : ""}
${taxPercent > 0 ? `<div class="row muted"><span>Pajak ${taxPercent}%</span><span>${formatIDR(taxAmount)}</span></div>` : ""}
${additionalFee > 0 ? `<div class="row muted"><span>${esc(additionalFeeName || "Biaya Tambahan")}</span><span>+ ${formatIDR(additionalFee)}</span></div>` : ""}
<div class="row tot"><span>TOTAL</span><span>${formatIDR(grandTotal)}</span></div>
${payRows ? `<hr/><div class="small">Bayar:</div>${payRows}` : ""}
${changeAmount > 0 ? `<div class="row" style="font-weight:700"><span>Kembalian</span><span>${formatIDR(changeAmount)}</span></div>` : ""}
${footer ? `<hr/><div class="c small">${esc(footer)}</div>` : ""}
</div><script>window.onload=function(){window.print();}<\/script></body></html>`;
}

export function buildReceiptWhatsAppText({
  storeName,
  invoiceNo,
  dateStr,
  lines,
  subtotal,
  discountTotal,
  taxPercent,
  taxAmount,
  additionalFee = 0,
  additionalFeeName = "Biaya Tambahan",
  grandTotal,
  changeAmount,
  payments,
}) {
  const hdr = `${storeName}\n${invoiceNo} · ${dateStr}\n---\n`;
  const items = lines
    .map((c) => {
      const d = Number(c.discount_amount || 0);
      const sub = Number(c.sell_price) * Number(c.qty);
      const net = sub - d;
      let t = `${c.qty}x ${c.name} @ ${formatIDR(c.sell_price)}`;
      if (d > 0) t += `\n   ${formatIDR(sub)} → ${formatIDR(net)} (diskon ${formatIDR(d)})`;
      else t += ` = ${formatIDR(net)}`;
      return t;
    })
    .join("\n");
  let foot = `\n---\nSubtotal ${formatIDR(subtotal)}`;
  if (discountTotal > 0) foot += `\nDiskon -${formatIDR(discountTotal)}`;
  if (taxPercent > 0) foot += `\nPajak ${taxPercent}% ${formatIDR(taxAmount)}`;
  if (additionalFee > 0) foot += `\n${additionalFeeName || "Biaya Tambahan"} +${formatIDR(additionalFee)}`;
  foot += `\n*TOTAL ${formatIDR(grandTotal)}*`;
  if (payments?.length)
    foot += `\nBayar:\n${payments.map((p) => `- ${p.method}: ${formatIDR(p.amount)}`).join("\n")}`;
  if (changeAmount > 0) foot += `\nKembalian: ${formatIDR(changeAmount)}`;
  foot += "\n\nTerima kasih.";
  return hdr + items + foot;
}

/** Formatter Plain Text untuk ESC/POS atau RawBT */
export function buildReceiptPlainText({
  storeName = "Toko",
  storeAddress = "",
  storePhone = "",
  footer = "",
  invoiceNo = "—",
  dateStr = "",
  lines = [],
  subtotal = 0,
  discountTotal = 0,
  taxPercent = 0,
  taxAmount = 0,
  additionalFee = 0,
  additionalFeeName = "Biaya Tambahan",
  grandTotal = 0,
  changeAmount = 0,
  payments = [],
  widthChars = 32,
}) {
  const lineStr = "-".repeat(widthChars);
  const doubleLine = "=".repeat(widthChars);

  const padRightLeft = (left, right) => {
    const spaceNeeded = widthChars - left.length - right.length;
    if (spaceNeeded <= 0) return left.slice(0, Math.max(1, widthChars - right.length - 1)) + " " + right;
    return left + " ".repeat(spaceNeeded) + right;
  };

  const centerText = (str) => {
    if (str.length >= widthChars) return str;
    const pad = Math.floor((widthChars - str.length) / 2);
    return " ".repeat(pad) + str;
  };

  let txt = "";
  txt += centerText(storeName) + "\n";
  if (storeAddress) txt += centerText(storeAddress) + "\n";
  if (storePhone) txt += centerText(storePhone) + "\n";
  txt += lineStr + "\n";
  txt += padRightLeft(invoiceNo, dateStr) + "\n";
  txt += lineStr + "\n";

  for (const c of lines) {
    const rawDisc = Number(c.discount_amount || 0);
    const sub = Number(c.sell_price) * Number(c.qty);
    const net = sub - rawDisc;
    txt += c.name + "\n";
    const qtyPrice = `${c.qty}x ${formatIDR(c.sell_price)}`;
    txt += padRightLeft(`  ${qtyPrice}`, formatIDR(net)) + "\n";
    if (rawDisc > 0) {
      txt += `  (disc: -${formatIDR(rawDisc)})\n`;
    }
  }

  txt += lineStr + "\n";
  txt += padRightLeft("Subtotal", formatIDR(subtotal)) + "\n";
  if (discountTotal > 0) txt += padRightLeft("Diskon total", `-${formatIDR(discountTotal)}`) + "\n";
  if (taxPercent > 0) txt += padRightLeft(`Pajak ${taxPercent}%`, formatIDR(taxAmount)) + "\n";
  if (additionalFee > 0) txt += padRightLeft(additionalFeeName || "Biaya Tambahan", `+${formatIDR(additionalFee)}`) + "\n";
  txt += doubleLine + "\n";
  txt += padRightLeft("TOTAL", formatIDR(grandTotal)) + "\n";
  txt += doubleLine + "\n";

  if (payments?.length) {
    for (const p of payments) {
      txt += padRightLeft(`Bayar (${p.method})`, formatIDR(p.amount)) + "\n";
    }
  }
  if (changeAmount > 0) {
    txt += padRightLeft("Kembalian", formatIDR(changeAmount)) + "\n";
  }

  if (footer) {
    txt += lineStr + "\n";
    txt += centerText(footer) + "\n";
  }
  txt += "\n\n\n";
  return txt;
}

/** Mengubah Plain Text Struk menjadi Byte Array ESC/POS */
export function textToEscPosBytes(text) {
  const encoder = new TextEncoder();
  const init = new Uint8Array([0x1b, 0x40]);
  const cut = new Uint8Array([0x1d, 0x56, 0x00]);
  const body = encoder.encode(text);

  const totalLength = init.length + body.length + cut.length;
  const result = new Uint8Array(totalLength);
  result.set(init, 0);
  result.set(body, init.length);
  result.set(cut, init.length + body.length);
  return result;
}

let savedBluetoothDevice = null;

/** Print via Web Bluetooth API (Auto Reconnect & Instant 1-Click Print) */
export async function printViaWebBluetooth(receiptText) {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth tidak didukung di browser ini. Gunakan Google Chrome pada Android.");
  }

  let device = savedBluetoothDevice;

  // Jika belum ada device tersimpan atau terputus, hubungkan ke device
  if (!device || !device.gatt) {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        "00001101-0000-1000-8000-00805f9b34fb",
        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      ],
    });
    savedBluetoothDevice = device;
  }

  let server = device.gatt.connected ? device.gatt : null;
  if (!server) {
    server = await device.gatt.connect();
  }

  const services = await server.getPrimaryServices();
  let targetChar = null;

  for (const service of services) {
    const chars = await service.getCharacteristics();
    for (const c of chars) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        targetChar = c;
        break;
      }
    }
    if (targetChar) break;
  }

  if (!targetChar) {
    savedBluetoothDevice = null;
    throw new Error("Karakteristik penulisan Bluetooth printer tidak ditemukan.");
  }

  const bytes = textToEscPosBytes(receiptText);
  const chunkSize = 512;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    if (targetChar.properties.write) {
      await targetChar.writeValueWithResponse(chunk);
    } else {
      await targetChar.writeValueWithoutResponse(chunk);
    }
  }
}

/** Print via RawBT App Intent (Android) */
export function printViaRawBT(receiptText) {
  const intentUrl = "intent:#Intent;scheme=rawbt;package=ru.a2ol.rawbtprint;S.txt=" + encodeURIComponent(receiptText) + ";end;";
  window.location.href = intentUrl;
}

