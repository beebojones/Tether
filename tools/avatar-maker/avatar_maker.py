"""
Tether Neon Avatar Maker (PySide6) - Tether-branded.

Pick a photo, pick a lane, tune two colors (default Tether violet/ember) and slide the
gradient around live. Flat lane = 1 paid render for a colorless template, then unlimited
free local recolor. 16-bit lane = 1 paid render per color. Chip export is free.
Paid renders are gated by a PIN (TETHER_AVATAR_MAKER_PIN in C:\\Workspace\\.env).

Run:  python avatar_maker.py
"""
import os
import sys
from PySide6 import QtCore, QtGui, QtWidgets

import avatar_engine as E

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out", "chips")

# ---- Tether brand system (from the app source) ----
BG, PANEL, PANEL2 = "#0d0b16", "#110f1d", "#0a0912"
LINE = "#241f38"
TEXT, MUTED, FAINT = "#f1edf9", "#b5aecf", "#7f769c"
VIOLET, EMBER = "#8b7bff", "#f28c4c"
SANS = ["Inter", "Segoe UI"]
DISPLAY = ["Space Grotesk", "Segoe UI Semibold", "Segoe UI"]
MONO = ["Fira Code", "Consolas"]

QSS = f"""
QWidget {{ color: {TEXT}; }}
QMainWindow, QWidget#central {{ background: {BG}; }}
QWidget#left {{ background: {PANEL}; border: 1px solid {LINE}; border-radius: 14px; }}
QLabel#title {{ color: {VIOLET}; }}
QLabel#subtitle {{ color: {FAINT}; }}
QLabel[role="hdr"] {{ color: {MUTED}; }}
QLabel#status {{ color: {FAINT}; }}
QFrame#brandbar {{ border-radius: 2px;
    background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 {VIOLET}, stop:1 {EMBER}); }}
QLabel#preview {{ background: {PANEL2}; border: 1px solid {LINE}; border-radius: 14px; color: {FAINT}; }}
QGroupBox {{ border: 1px solid {LINE}; border-radius: 10px; margin-top: 16px; padding: 10px 8px 8px; }}
QGroupBox::title {{ subcontrol-origin: margin; left: 12px; padding: 0 4px; color: {MUTED}; }}
QPushButton {{ background: #1a1730; border: 1px solid #342f52; border-radius: 8px; padding: 8px 12px; }}
QPushButton:hover {{ background: #221d3d; }}
QPushButton:disabled {{ color: #6b6386; border-color: #2a2542; }}
QPushButton#primary {{ background: {VIOLET}; color: {BG}; border: none; font-weight: 700; }}
QPushButton#primary:hover {{ background: #9c8dff; }}
QPushButton#primary:disabled {{ background: #3a3550; color: {FAINT}; }}
QComboBox {{ background: #1a1730; border: 1px solid #342f52; border-radius: 6px; padding: 5px 8px; }}
QComboBox QAbstractItemView {{ background: {PANEL}; selection-background-color: {VIOLET}; }}
QRadioButton {{ padding: 3px; }}
QSlider::groove:horizontal {{ height: 6px; background: {LINE}; border-radius: 3px; }}
QSlider::sub-page:horizontal {{ background: {VIOLET}; border-radius: 3px; }}
QSlider::handle:horizontal {{ width: 16px; background: {VIOLET}; border-radius: 8px; margin: -6px 0; }}
"""


def font(families, size, bold=False):
    f = QtGui.QFont()
    f.setFamilies(families)
    f.setPointSize(size)
    if bold:
        f.setWeight(QtGui.QFont.Weight.Bold)
    return f


def pil_to_pixmap(img):
    img = img.convert("RGBA")
    data = img.tobytes("raw", "RGBA")
    qimg = QtGui.QImage(data, img.width, img.height, QtGui.QImage.Format.Format_RGBA8888)
    return QtGui.QPixmap.fromImage(qimg.copy())


class Worker(QtCore.QThread):
    done = QtCore.Signal(object)
    fail = QtCore.Signal(str)

    def __init__(self, fn):
        super().__init__()
        self.fn = fn

    def run(self):
        try:
            self.done.emit(self.fn())
        except Exception as e:
            self.fail.emit(f"{type(e).__name__}: {e}")


class PinDialog(QtWidgets.QDialog):
    """Branded PIN pad. Accepts only when the entered PIN matches. Keyboard also works."""
    def __init__(self, expected, cost_text, parent=None):
        super().__init__(parent)
        self.expected = str(expected)
        self.entry = ""
        self.setModal(True)
        self.setFixedWidth(292)
        self.setWindowTitle("Confirm paid render")
        self.setStyleSheet(f"QDialog {{ background:{PANEL}; }}")
        C = QtCore.Qt.AlignmentFlag.AlignCenter

        v = QtWidgets.QVBoxLayout(self)
        v.setContentsMargins(24, 20, 24, 22)
        v.setSpacing(9)
        bar = QtWidgets.QFrame()
        bar.setObjectName("brandbar")
        bar.setFixedHeight(4)
        v.addWidget(bar)
        title = QtWidgets.QLabel("Enter PIN")
        title.setFont(font(DISPLAY, 15, bold=True))
        title.setStyleSheet(f"color:{VIOLET};")
        v.addWidget(title)
        cost = QtWidgets.QLabel(cost_text)
        cost.setFont(font(SANS, 9))
        cost.setStyleSheet(f"color:{FAINT};")
        cost.setWordWrap(True)
        v.addWidget(cost)

        self.dots = QtWidgets.QLabel()
        self.dots.setAlignment(C)
        self.dots.setTextFormat(QtCore.Qt.TextFormat.RichText)
        self.dots.setFont(font(MONO, 20))
        v.addSpacing(4)
        v.addWidget(self.dots)
        self.msg = QtWidgets.QLabel(" ")
        self.msg.setAlignment(C)
        self.msg.setFont(font(SANS, 9))
        self.msg.setStyleSheet(f"color:{EMBER};")
        v.addWidget(self.msg)

        grid = QtWidgets.QGridLayout()
        grid.setSpacing(8)
        keys = [("1", 0, 0), ("2", 0, 1), ("3", 0, 2), ("4", 1, 0), ("5", 1, 1), ("6", 1, 2),
                ("7", 2, 0), ("8", 2, 1), ("9", 2, 2), ("⌫", 3, 0), ("0", 3, 1), ("✕", 3, 2)]
        for label, r, c in keys:
            b = QtWidgets.QPushButton(label)
            b.setFixedSize(72, 44)
            b.setFont(font(MONO, 13, bold=True))
            b.setFocusPolicy(QtCore.Qt.FocusPolicy.NoFocus)
            if label == "⌫":
                b.clicked.connect(self._back)
            elif label == "✕":
                b.clicked.connect(self.reject)
            else:
                b.clicked.connect(lambda _=False, d=label: self._add(d))
            grid.addWidget(b, r, c)
        v.addLayout(grid)
        self._refresh()

    def _add(self, d):
        if len(self.entry) < len(self.expected):
            self.entry += d
            self.msg.setText(" ")
            self._refresh()
            if len(self.entry) == len(self.expected):
                QtCore.QTimer.singleShot(90, self._check)

    def _back(self):
        self.entry = self.entry[:-1]
        self.msg.setText(" ")
        self._refresh()

    def _check(self):
        if self.entry == self.expected:
            self.accept()
        else:
            self.msg.setText("Wrong PIN, try again")
            self.entry = ""
            self._refresh()

    def _refresh(self):
        parts = []
        for i in range(len(self.expected)):
            filled = i < len(self.entry)
            parts.append(f'<span style="color:{VIOLET if filled else FAINT}">'
                         f'{"●" if filled else "○"}</span>')
        self.dots.setText("&nbsp;&nbsp;".join(parts))

    def keyPressEvent(self, e):
        if e.text().isdigit():
            self._add(e.text())
        elif e.key() == QtCore.Qt.Key.Key_Backspace:
            self._back()
        elif e.key() == QtCore.Qt.Key.Key_Escape:
            self.reject()
        else:
            super().keyPressEvent(e)


class ColorButton(QtWidgets.QPushButton):
    changed = QtCore.Signal()

    def __init__(self, hex_default):
        super().__init__()
        self._hex = hex_default
        self.setFixedHeight(36)
        self.setFont(font(MONO, 9, bold=True))
        self.clicked.connect(self._pick)
        self._apply()

    def hex(self):
        return self._hex

    def _apply(self):
        c = QtGui.QColor(self._hex)
        fg = "#0d0b16" if c.lightness() > 140 else "#ffffff"
        self.setStyleSheet(f"background:{self._hex}; color:{fg}; border:1px solid #4a4468;"
                           f"border-radius:8px;")
        self.setText(self._hex.upper())

    def _pick(self):
        c = QtWidgets.QColorDialog.getColor(QtGui.QColor(self._hex), self, "Pick color")
        if c.isValid():
            self._hex = c.name()
            self._apply()
            self.changed.emit()


class Main(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Tether · Neon Avatar Maker")
        self.resize(960, 640)
        self.photo_path = None
        self.template_data = None
        self.full_img = None
        self.worker = None

        # ---------- preview ----------
        self.preview = QtWidgets.QLabel("Load a photo to begin")
        self.preview.setObjectName("preview")
        self.preview.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        self.preview.setMinimumWidth(540)

        # ---------- left column ----------
        col = QtWidgets.QVBoxLayout()
        col.setContentsMargins(18, 18, 18, 18)
        col.setSpacing(9)

        title = QtWidgets.QLabel("Neon Avatar Maker")
        title.setObjectName("title")
        title.setFont(font(DISPLAY, 17, bold=True))
        sub = QtWidgets.QLabel("Tether")
        sub.setObjectName("subtitle")
        sub.setFont(font(MONO, 9))
        bar = QtWidgets.QFrame()
        bar.setObjectName("brandbar")
        bar.setFixedHeight(4)
        col.addWidget(title)
        col.addWidget(sub)
        col.addSpacing(2)
        col.addWidget(bar)
        col.addSpacing(6)

        self.btn_photo = QtWidgets.QPushButton("Load Photo…")
        self.btn_photo.clicked.connect(self.load_photo)
        col.addWidget(self.btn_photo)
        self.photo_lbl = QtWidgets.QLabel("no photo loaded")
        self.photo_lbl.setStyleSheet(f"color:{FAINT};")
        col.addWidget(self.photo_lbl)

        col.addWidget(self._hdr("LANE"))
        self.lane_flat = QtWidgets.QRadioButton("Flat glyph   ·   free gradient play")
        self.lane_16 = QtWidgets.QRadioButton("16-bit pixel   ·   paid per color")
        self.lane_flat.setChecked(True)
        for r in (self.lane_flat, self.lane_16):
            r.toggled.connect(self.on_lane)
            col.addWidget(r)

        col.addWidget(self._hdr("COLORS"))
        self.colA = ColorButton(E.DEFAULT_A)
        self.colB = ColorButton(E.DEFAULT_B)
        self.colA.changed.connect(self.live_update)
        self.colB.changed.connect(self.live_update)
        crow = QtWidgets.QHBoxLayout()
        crow.setSpacing(8)
        crow.addWidget(self.colA)
        crow.addWidget(self.colB)
        col.addLayout(crow)

        self.grad_box = QtWidgets.QGroupBox("Gradient")
        gl = QtWidgets.QFormLayout(self.grad_box)
        gl.setSpacing(8)
        self.mode = QtWidgets.QComboBox()
        self.mode.addItems(["linear", "split", "radial"])
        self.mode.currentTextChanged.connect(self.live_update)
        self.angle = QtWidgets.QDial()
        self.angle.setRange(0, 359)
        self.angle.setValue(90)
        self.angle.setNotchesVisible(True)
        self.angle.setFixedHeight(66)
        self.angle.valueChanged.connect(self.live_update)
        self.pos = QtWidgets.QSlider(QtCore.Qt.Orientation.Horizontal)
        self.pos.setRange(0, 100)
        self.pos.setValue(50)
        self.pos.valueChanged.connect(self.live_update)
        gl.addRow("Mode", self.mode)
        gl.addRow("Angle", self.angle)
        gl.addRow("Position", self.pos)
        col.addWidget(self.grad_box)

        col.addWidget(self._hdr("RENDER"))
        self.model = QtWidgets.QComboBox()
        self.model.addItems(["pro   ~$0.13", "flash   ~$0.04"])
        col.addWidget(self.model)
        self.btn_gen = QtWidgets.QPushButton("Generate Template   ·   paid")
        self.btn_gen.setObjectName("primary")
        self.btn_gen.clicked.connect(self.generate)
        col.addWidget(self.btn_gen)
        self.btn_export = QtWidgets.QPushButton("Export Chips   ·   free")
        self.btn_export.clicked.connect(self.export)
        self.btn_export.setEnabled(False)
        col.addWidget(self.btn_export)

        self.status = QtWidgets.QLabel("Flat lane: one paid render per photo, then style freely.")
        self.status.setObjectName("status")
        self.status.setWordWrap(True)
        self.status.setFont(font(SANS, 9))
        col.addWidget(self.status)
        col.addStretch(1)

        left = QtWidgets.QWidget()
        left.setObjectName("left")
        left.setLayout(col)
        left.setFixedWidth(348)

        central = QtWidgets.QWidget()
        central.setObjectName("central")
        cl = QtWidgets.QHBoxLayout(central)
        cl.setContentsMargins(16, 16, 16, 16)
        cl.setSpacing(16)
        cl.addWidget(left)
        cl.addWidget(self.preview, 1)
        self.setCentralWidget(central)

        self.preview.setFont(font(DISPLAY, 13))
        self.preview.setText("Load a photo to begin")
        self.on_lane()

    def _hdr(self, text):
        l = QtWidgets.QLabel(text)
        l.setProperty("role", "hdr")
        l.setFont(font(DISPLAY, 9, bold=True))
        l.setStyleSheet("letter-spacing:1px; margin-top:6px;")
        return l

    # ---------- photo ----------
    def load_photo(self):
        path, _ = QtWidgets.QFileDialog.getOpenFileName(
            self, "Choose a photo", HERE, "Images (*.png *.jpg *.jpeg *.webp)")
        if path:
            self.set_photo(path)

    def set_photo(self, path):
        self.photo_path = path
        self.template_data = None
        self.full_img = None
        self.btn_export.setEnabled(False)
        self.photo_lbl.setText(os.path.basename(path))
        self.preview.setPixmap(QtGui.QPixmap(path).scaled(
            self.preview.size(), QtCore.Qt.AspectRatioMode.KeepAspectRatio,
            QtCore.Qt.TransformationMode.SmoothTransformation))

    # ---------- lane ----------
    def on_lane(self, *_):
        flat = self.lane_flat.isChecked()
        self.grad_box.setEnabled(flat)
        self.btn_gen.setText("Generate Template   ·   paid" if flat else "Generate   ·   paid")
        if flat and self.template_data is not None:
            self.live_update()

    def model_key(self):
        return "pro" if self.model.currentIndex() == 0 else "flash"

    # ---------- live local recolor ----------
    def live_update(self, *_):
        if not (self.lane_flat.isChecked() and self.template_data):
            return
        img = E.recolor_flat(
            self.template_data, self.colA.hex(), self.colB.hex(),
            self.mode.currentText(), float(self.angle.value()), self.pos.value() / 100.0)
        self.full_img = img
        self._show(img)

    def _show(self, img):
        self.preview.setPixmap(pil_to_pixmap(img).scaled(
            self.preview.size(), QtCore.Qt.AspectRatioMode.KeepAspectRatio,
            QtCore.Qt.TransformationMode.SmoothTransformation))

    # ---------- PIN gate ----------
    def check_pin(self):
        pin = E.load_pin()
        if not pin:
            self.status.setText("No PIN set in .env - paid render allowed. Add TETHER_AVATAR_MAKER_PIN to gate it.")
            return True
        cost = "pro · ~$0.13" if self.model_key() == "pro" else "flash · ~$0.04"
        if PinDialog(pin, f"This render spends credits  ({cost}).", self).exec() \
                == QtWidgets.QDialog.DialogCode.Accepted:
            return True
        self.status.setText("Render cancelled.")
        return False

    # ---------- paid render ----------
    def generate(self):
        if not self.photo_path:
            self.status.setText("Load a photo first.")
            return
        if not self.check_pin():
            return
        self._busy(True, "Rendering in the cloud…  ~15s")
        flat = self.lane_flat.isChecked()
        mk, p = self.model_key(), self.photo_path
        if flat:
            fn = lambda: E.generate_template(p, mk)
        else:
            a, b = self.colA.hex(), self.colB.hex()
            fn = lambda: E.generate_16bit(p, a, b, mk)
        self.worker = Worker(fn)
        self.worker.done.connect(self._gen_done)
        self.worker.fail.connect(self._gen_fail)
        self.worker.start()

    def _gen_done(self, img):
        if self.lane_flat.isChecked():
            self.template_data = E.prepare_template(img)
            self._busy(False, "Template ready. Play with colors and gradient live - free.")
            self.live_update()
        else:
            self.full_img = img
            self._show(img)
            self._busy(False, "Rendered. Change colors and Generate to re-roll.")
        self.btn_export.setEnabled(True)

    def _gen_fail(self, msg):
        self._busy(False, f"Render failed: {msg}")

    def _busy(self, on, msg):
        for w in (self.btn_gen, self.btn_photo, self.lane_flat, self.lane_16):
            w.setEnabled(not on)
        self.status.setText(msg)

    # ---------- export ----------
    def export(self):
        if self.full_img is None:
            return
        d = QtWidgets.QFileDialog.getExistingDirectory(self, "Export folder", OUT) or OUT
        os.makedirs(d, exist_ok=True)
        stem = os.path.splitext(os.path.basename(self.photo_path))[0]
        lane = "flat" if self.lane_flat.isChecked() else "16bit"
        margin = 0.10 if self.lane_flat.isChecked() else 0.15
        for size in (256, 64):
            E.circular_chip(self.full_img, size, margin).save(
                os.path.join(d, f"{stem}_{lane}_c{size}.png"))
        self.status.setText(f"Exported {stem}_{lane}_c256 + c64  →  {d}")


if __name__ == "__main__":
    app = QtWidgets.QApplication(sys.argv)
    app.setStyle("Fusion")
    app.setFont(font(SANS, 10))
    app.setStyleSheet(QSS)
    w = Main()
    w.show()
    sys.exit(app.exec())
