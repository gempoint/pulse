import { createCanvas, loadImage, registerFont, Canvas } from 'canvas';

registerFont(require("@tamagui/font-inter/otf/Inter-Medium.otf").default, { family: 'Inter' })
registerFont(require("@tamagui/font-inter/otf/Inter-Bold.otf").default, { family: 'Inter', weight: 'bold' })
registerFont(require("../fonts/AppleColorEmoji.ttf").default, { family: 'Apple Color Emoji' })


export default class ProfileCardRenderer {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = createCanvas(600, 320);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.textDrawingMode = "glyph"
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  async render(user: UserProfile): Promise<string> {
    // Draw glassmorphic border
    const rgb = this.hexToRgb(user.color);
    this.ctx.save();
    this.roundRect(0, 0, 600, 320, 16);
    this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Inner background
    this.ctx.fillStyle = '#1a1a1a';
    this.roundRect(2, 2, 596, 316, 14);
    this.ctx.fill();

    // Load and draw profile picture
    try {
      const avatar = await loadImage(user.pfp);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(300, 102, 64, 0, Math.PI * 2);
      this.ctx.clip();
      this.ctx.drawImage(avatar, 236, 38, 128, 128);
      this.ctx.restore();
    } catch (error) {
      // Fallback if image fails to load
      this.ctx.fillStyle = '#374151';
      this.ctx.beginPath();
      this.ctx.arc(300, 102, 64, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw name
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 32px Inter';
    const nameWidth = this.ctx.measureText(user.name).width;
    this.ctx.fillText(user.name, 300 - nameWidth / 2, 202);

    // Draw verified badge if applicable
    if (user.verified) {
      this.ctx.fillStyle = '#3b82f6';
      this.ctx.font = '28px Inter';
      this.ctx.fillText('✓', 300 + nameWidth / 2 + 12, 202);
    }

    // Draw username
    this.ctx.fillStyle = '#9ca3af';
    this.ctx.font = '20px Inter';
    const usernameWidth = this.ctx.measureText(`@${user.username}`).width;
    this.ctx.fillText(`@${user.username}`, 300 - usernameWidth / 2, 232);

    // Draw bio
    this.ctx.fillStyle = '#e5e7eb';
    this.ctx.font = '20px Inter';
    const words = "come join!".split(' ');
    let line = '';
    let y = 262;
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = this.ctx.measureText(testLine);
      if (metrics.width > 550) {
        this.ctx.fillText(line, 300 - metrics.width / 2, y);
        line = word + ' ';
        y += 28;
      } else {
        line = testLine;
      }
    }
    this.ctx.fillText(line, 300 - this.ctx.measureText(line).width / 2, y);

    //// Draw badges
    //let badgeX = 300 - 70;
    //if (user.staff) {
    //  this.ctx.fillStyle = '#374151';
    //  this.roundRect(badgeX, y + 20, 50, 28, 4);
    //  this.ctx.fill();
    //  this.ctx.fillStyle = 'white';
    //  this.ctx.font = '14px Inter';
    //  this.ctx.fillText('STAFF', badgeX + 10, y + 38);
    //  badgeX += 70;
    //}
    //if (user.artist) {
    //  this.ctx.fillStyle = '#374151';
    //  this.roundRect(badgeX, y + 20, 65, 28, 4);
    //  this.ctx.fill();
    //  this.ctx.fillStyle = 'white';
    //  this.ctx.font = '14px Inter';
    //  this.ctx.fillText('ARTIST', badgeX + 10, y + 38);
    //}

    //return this.canvas.toBuffer();
    return this.canvas.toDataURL()
  }
}