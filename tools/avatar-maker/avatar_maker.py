"""
Tether Neon Avatar Maker (PySide6) - Tether-branded.

Pick a photo (or drop one on the window), pick a lane, tune two colors (default Tether
violet/ember) and slide the gradient around live. Flat lane = 1 paid render for a colorless
template, then unlimited free local recolor. 16-bit lane = 1 paid render per color.
Chip export is free: name the file, choose fill/nudge/sizes, export.
Paid renders are gated by a PIN (TETHER_AVATAR_MAKER_PIN in C:\\Workspace\\.env).

Run:  python avatar_maker.py
"""
import math
import os
import random
import sys
from PIL import Image
from PySide6 import QtCore, QtGui, QtWidgets

import avatar_engine as E

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out", "chips")
IMG_EXT = (".png", ".jpg", ".jpeg", ".webp", ".bmp")
PREVIEW_PX = 512      # live recolor res: ~20fps vs ~4fps at full 1024. Export stays full res.

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
QWidget#left, QWidget#leftinner {{ background: {PANEL}; }}
QScrollArea#leftscroll {{ background: {PANEL}; border: 1px solid {LINE}; border-radius: 14px; }}
QLabel#title {{ color: {VIOLET}; }}
QLabel#subtitle {{ color: {FAINT}; }}
QLabel[role="hdr"] {{ color: {MUTED}; }}
QLabel[role="val"] {{ color: {FAINT}; }}
QLabel#status {{ color: {FAINT}; }}
QFrame#brandbar {{ border-radius: 2px;
    background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 {VIOLET}, stop:1 {EMBER}); }}
QLabel#preview {{ background: {PANEL2}; border: 1px solid {LINE}; border-radius: 14px; color: {FAINT}; }}
QWidget#strip {{ background: {PANEL2}; border: 1px solid {LINE}; border-radius: 12px; }}
QGroupBox {{ border: 1px solid {LINE}; border-radius: 10px; margin-top: 16px; padding: 10px 8px 8px; }}
QGroupBox::title {{ subcontrol-origin: margin; left: 12px; padding: 0 4px; color: {MUTED}; }}
QPushButton {{ background: #1a1730; border: 1px solid #342f52; border-radius: 8px; padding: 8px 12px; }}
QPushButton:hover {{ background: #221d3d; }}
QPushButton:disabled {{ color: #6b6386; border-color: #2a2542; }}
QPushButton#primary {{ background: {VIOLET}; color: {BG}; border: none; font-weight: 700; }}
QPushButton#primary:hover {{ background: #9c8dff; }}
QPushButton#primary:disabled {{ background: #3a3550; color: {FAINT}; }}
QPushButton#chip {{ padding: 4px 8px; }}
QComboBox {{ background: #1a1730; border: 1px solid #342f52; border-radius: 6px; padding: 5px 8px; }}
QComboBox QAbstractItemView {{ background: {PANEL}; selection-background-color: {VIOLET}; }}
QLineEdit {{ background: #1a1730; border: 1px solid #342f52; border-radius: 6px; padding: 6px 8px;
    selection-background-color: {VIOLET}; selection-color: {BG}; }}
QLineEdit:focus {{ border: 1px solid {VIOLET}; }}
QRadioButton, QCheckBox {{ padding: 3px; }}
QSlider::groove:horizontal {{ height: 6px; background: {LINE}; border-radius: 3px; }}
QSlider::sub-page:horizontal {{ background: {VIOLET}; border-radius: 3px; }}
QSlider::handle:horizontal {{ width: 16px; background: {VIOLET}; border-radius: 8px; margin: -6px 0; }}
QScrollBar:vertical {{ background: {PANEL}; width: 10px; margin: 4px; }}
QScrollBar::handle:vertical {{ background: #342f52; border-radius: 5px; min-height: 30px; }}
QScrollBar::add-line, QScrollBar::sub-line {{ height: 0; }}
QToolTip {{ background: {PANEL2}; color: {TEXT}; border: 1px solid {LINE}; padding: 4px; }}
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


class AngleDial(QtWidgets.QWidget):
    """Brand-painted replacement for QDial (QSS can't reach QDial's internals).

    Drop-in for what this app used: value()/setValue()/valueChanged. 0deg points right
    and 90deg points down, matching the engine's gradient axis, so the knob shows
    the direction the gradient actually runs.
    """
    valueChanged = QtCore.Signal(int)
    SIZE, RING, KNOB = 68, 5, 6

    def __init__(self, value=90):
        super().__init__()
        self._v = value % 360
        self._drag = False
        self.setFixedSize(self.SIZE, self.SIZE)
        self.setFocusPolicy(QtCore.Qt.FocusPolicy.StrongFocus)
        self.setCursor(QtCore.Qt.CursorShape.PointingHandCursor)

    def value(self):
        return self._v

    def setValue(self, v):
        v = int(v) % 360
        if v != self._v:
            self._v = v
            self.update()
            self.valueChanged.emit(v)

    # -- interaction: drag anywhere in the widget, wheel and arrows nudge --
    def _from_pos(self, p):
        c = QtCore.QPointF(self.width() / 2, self.height() / 2)
        self.setValue(round(math.degrees(math.atan2(p.y() - c.y(), p.x() - c.x()))))

    def mousePressEvent(self, e):
        self._drag = True
        self._from_pos(e.position())

    def mouseMoveEvent(self, e):
        if self._drag:
            self._from_pos(e.position())

    def mouseReleaseEvent(self, e):
        self._drag = False

    def wheelEvent(self, e):
        step = 5 if e.modifiers() & QtCore.Qt.KeyboardModifier.ShiftModifier else 1
        self.setValue(self._v + (step if e.angleDelta().y() > 0 else -step))

    def keyPressEvent(self, e):
        k, step = e.key(), 5 if e.modifiers() & QtCore.Qt.KeyboardModifier.ShiftModifier else 1
        if k in (QtCore.Qt.Key.Key_Left, QtCore.Qt.Key.Key_Down):
            self.setValue(self._v - step)
        elif k in (QtCore.Qt.Key.Key_Right, QtCore.Qt.Key.Key_Up):
            self.setValue(self._v + step)
        elif k == QtCore.Qt.Key.Key_Home:
            self.setValue(0)
        else:
            super().keyPressEvent(e)

    def _pen(self, brush):
        pen = QtGui.QPen(brush, self.RING)
        pen.setCapStyle(QtCore.Qt.PenCapStyle.RoundCap)
        return pen

    def paintEvent(self, _e):
        p = QtGui.QPainter(self)
        p.setRenderHint(QtGui.QPainter.RenderHint.Antialiasing)
        r = self.rect().adjusted(self.KNOB, self.KNOB, -self.KNOB, -self.KNOB)
        c = QtCore.QPointF(self.width() / 2, self.height() / 2)

        p.setPen(self._pen(QtGui.QBrush(QtGui.QColor(LINE))))
        p.drawEllipse(r)

        # progress arc, 0 at 3 o'clock running clockwise (Qt angles are 1/16 deg, CCW)
        grad = QtGui.QConicalGradient(c, 0)
        grad.setColorAt(0.0, QtGui.QColor(VIOLET))
        grad.setColorAt(0.5, QtGui.QColor(EMBER))
        grad.setColorAt(1.0, QtGui.QColor(VIOLET))
        p.setPen(self._pen(QtGui.QBrush(grad)))
        p.drawArc(r, 0, -self._v * 16)

        a = math.radians(self._v)
        k = QtCore.QPointF(c.x() + r.width() / 2 * math.cos(a),
                           c.y() + r.height() / 2 * math.sin(a))
        p.setPen(QtGui.QPen(QtGui.QColor(BG), 2))
        p.setBrush(QtGui.QColor(EMBER if self.hasFocus() else VIOLET))
        p.drawEllipse(k, self.KNOB, self.KNOB)

        p.setPen(QtGui.QColor(MUTED))
        p.setFont(font(MONO, 8, bold=True))
        p.drawText(self.rect(), QtCore.Qt.AlignmentFlag.AlignCenter, f"{self._v}°")


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

    def set_hex(self, h, emit=True):
        self._hex = h
        self._apply()
        if emit:
            self.changed.emit()

    def _apply(self):
        c = QtGui.QColor(self._hex)
        fg = "#0d0b16" if c.lightness() > 140 else "#ffffff"
        self.setStyleSheet(f"background:{self._hex}; color:{fg}; border:1px solid #4a4468;"
                           f"border-radius:8px;")
        self.setText(self._hex.upper())

    def _pick(self):
        c = QtWidgets.QColorDialog.getColor(QtGui.QColor(self._hex), self, "Pick color")
        if c.isValid():
            self.set_hex(c.name())


class VariantDialog(QtWidgets.QDialog):
    """Nine free local looks off the current template. Click one to adopt its settings."""
    GRID = [("linear", 90, 0.5), ("linear", 45, 0.35), ("linear", 0, 0.5),
            ("split", 90, 0.45), ("split", 20, 0.55), ("radial", 0, 0.45),
            ("radial", 0, 0.7), ("bands", 60, 0.5), ("linear", 135, 0.65)]

    def __init__(self, render, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Pick a look")
        self.setStyleSheet(f"QDialog {{ background:{PANEL}; }}")
        self.picked = None
        v = QtWidgets.QVBoxLayout(self)
        v.setContentsMargins(18, 16, 18, 16)
        v.setSpacing(10)
        bar = QtWidgets.QFrame()
        bar.setObjectName("brandbar")
        bar.setFixedHeight(4)
        v.addWidget(bar)
        head = QtWidgets.QLabel("Variants  ·  free, click to adopt")
        head.setFont(font(DISPLAY, 13, bold=True))
        head.setStyleSheet(f"color:{VIOLET};")
        v.addWidget(head)

        grid = QtWidgets.QGridLayout()
        grid.setSpacing(10)
        for i, params in enumerate(self.GRID):
            b = QtWidgets.QToolButton()
            b.setIconSize(QtCore.QSize(132, 132))
            b.setIcon(QtGui.QIcon(pil_to_pixmap(render(params))))
            b.setStyleSheet(f"background:{PANEL2}; border:1px solid {LINE}; border-radius:10px;"
                            f"padding:6px;")
            b.setCursor(QtCore.Qt.CursorShape.PointingHandCursor)
            b.setToolTip(f"{params[0]} · {params[1]}° · {int(params[2] * 100)}%")
            b.clicked.connect(lambda _=False, p=params: self._pick(p))
            grid.addWidget(b, i // 3, i % 3)
        v.addLayout(grid)

    def _pick(self, params):
        self.picked = params
        self.accept()


class Main(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Tether · Neon Avatar Maker")
        self.resize(1120, 800)
        self.setAcceptDrops(True)
        self.photo_path = None
        self.template_data = None      # full-res prepared template (export)
        self.template_small = None     # PREVIEW_PX prepared template (live)
        self.view_img = None           # what the preview + chip strip show
        self.render_img = None         # 16-bit lane paid render, full res
        self.worker = None
        self.history = []
        self.state = E.load_state()
        self.presets = E.load_presets()
        self.rng = random.Random()
        self._loading = False
        self._pending = False

        self._build_left()
        self._build_right()

        central = QtWidgets.QWidget()
        central.setObjectName("central")
        cl = QtWidgets.QHBoxLayout(central)
        cl.setContentsMargins(16, 16, 16, 16)
        cl.setSpacing(16)
        cl.addWidget(self.leftscroll)
        cl.addLayout(self.rightcol, 1)
        self.setCentralWidget(central)

        self._shortcuts()
        self._restore_state()
        self.on_lane()

    # ------------------------------------------------------------------ build
    def _hdr(self, text):
        l = QtWidgets.QLabel(text)
        l.setProperty("role", "hdr")
        l.setFont(font(DISPLAY, 9, bold=True))
        l.setStyleSheet("letter-spacing:1px; margin-top:6px;")
        return l

    def _slider(self, form, label, lo, hi, val, fmt, on_change=None):
        """A slider row with a live value readout. fmt(int) -> display string."""
        s = QtWidgets.QSlider(QtCore.Qt.Orientation.Horizontal)
        s.setRange(lo, hi)
        s.setValue(val)
        cap = QtWidgets.QLabel(fmt(val))
        cap.setProperty("role", "val")
        cap.setFont(font(MONO, 8))
        cap.setFixedWidth(46)
        cap.setAlignment(QtCore.Qt.AlignmentFlag.AlignRight |
                         QtCore.Qt.AlignmentFlag.AlignVCenter)
        row = QtWidgets.QHBoxLayout()
        row.setSpacing(8)
        row.addWidget(s, 1)
        row.addWidget(cap)
        s.valueChanged.connect(lambda v: cap.setText(fmt(v)))
        s.valueChanged.connect(on_change or self.live_update)
        form.addRow(label, row)
        return s

    def _build_left(self):
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

        # ---- source ----
        self.btn_photo = QtWidgets.QPushButton("Load Photo…   (Ctrl+O)")
        self.btn_photo.clicked.connect(self.load_photo)
        col.addWidget(self.btn_photo)
        self.recent = QtWidgets.QComboBox()
        self.recent.setToolTip("Recently used photos")
        self.recent.activated.connect(self._recent_pick)
        col.addWidget(self.recent)
        self.photo_lbl = QtWidgets.QLabel("no photo loaded  ·  or drop one here")
        self.photo_lbl.setStyleSheet(f"color:{FAINT};")
        col.addWidget(self.photo_lbl)

        # ---- lane ----
        col.addWidget(self._hdr("LANE"))
        self.lane_flat = QtWidgets.QRadioButton("Flat glyph   ·   free gradient play")
        self.lane_16 = QtWidgets.QRadioButton("16-bit pixel   ·   paid per color")
        self.lane_flat.setChecked(True)
        for r in (self.lane_flat, self.lane_16):
            r.toggled.connect(self.on_lane)
            col.addWidget(r)

        # ---- colors ----
        col.addWidget(self._hdr("COLORS"))
        prow = QtWidgets.QHBoxLayout()
        prow.setSpacing(6)
        self.preset = QtWidgets.QComboBox()
        self.preset.activated.connect(self._preset_pick)
        self.btn_preset_save = QtWidgets.QPushButton("＋")
        self.btn_preset_save.setObjectName("chip")
        self.btn_preset_save.setFixedWidth(34)
        self.btn_preset_save.setToolTip("Save this pair as a preset")
        self.btn_preset_save.clicked.connect(self._preset_save)
        self.btn_preset_del = QtWidgets.QPushButton("－")
        self.btn_preset_del.setObjectName("chip")
        self.btn_preset_del.setFixedWidth(34)
        self.btn_preset_del.setToolTip("Delete the selected saved preset")
        self.btn_preset_del.clicked.connect(self._preset_delete)
        prow.addWidget(self.preset, 1)
        prow.addWidget(self.btn_preset_save)
        prow.addWidget(self.btn_preset_del)
        col.addLayout(prow)
        self._reload_presets()

        self.colA = ColorButton(E.DEFAULT_A)
        self.colB = ColorButton(E.DEFAULT_B)
        self.colA.changed.connect(self.live_update)
        self.colB.changed.connect(self.live_update)
        crow = QtWidgets.QHBoxLayout()
        crow.setSpacing(8)
        crow.addWidget(self.colA)
        crow.addWidget(self.colB)
        col.addLayout(crow)

        srow = QtWidgets.QHBoxLayout()
        srow.setSpacing(8)
        self.btn_swap = QtWidgets.QPushButton("Swap A/B   (Ctrl+S)")
        self.btn_swap.clicked.connect(self.swap_colors)
        self.btn_rand = QtWidgets.QPushButton("Randomize   (Ctrl+R)")
        self.btn_rand.clicked.connect(self.randomize_colors)
        srow.addWidget(self.btn_swap)
        srow.addWidget(self.btn_rand)
        col.addLayout(srow)

        # ---- gradient ----
        self.grad_box = QtWidgets.QGroupBox("Gradient")
        gl = QtWidgets.QFormLayout(self.grad_box)
        gl.setSpacing(8)
        self.mode = QtWidgets.QComboBox()
        self.mode.addItems(E.GRADIENT_MODES)
        self.mode.currentTextChanged.connect(self.live_update)
        self.angle = AngleDial(90)
        self.angle.setToolTip("Gradient axis: the knob points the way the gradient runs.\n"
                              "Drag it, scroll it, or nudge with arrows (Shift = 5°).")
        self.angle.valueChanged.connect(self.live_update)
        arow = QtWidgets.QHBoxLayout()
        arow.addWidget(self.angle)
        arow.addStretch(1)
        gl.addRow("Mode", self.mode)
        gl.addRow("Angle", arow)
        self.pos = self._slider(gl, "Position", 0, 100, 50, lambda v: f"{v}%")
        self.soft = self._slider(gl, "Softness", 5, 200, 100, lambda v: f"{v}%")
        col.addWidget(self.grad_box)

        # ---- look ----
        self.look_box = QtWidgets.QGroupBox("Look")
        ll = QtWidgets.QFormLayout(self.look_box)
        ll.setSpacing(8)
        self.glow = self._slider(ll, "Glow", 0, 200, 85, lambda v: f"{v}%")
        self.glow_r = self._slider(ll, "Glow size", 2, 80, 20, lambda v: f"{v / 10:.1f}%")
        self.thresh = self._slider(ll, "Line", 5, 85, 35, lambda v: f"{v}%")
        self.face_tint = QtWidgets.QCheckBox("Fill face with Tether navy")
        self.face_tint.setChecked(True)
        self.face_tint.toggled.connect(self.live_update)
        ll.addRow("", self.face_tint)
        self.bg_mode = QtWidgets.QComboBox()
        self.bg_mode.addItems(["Tether navy", "Transparent", "Custom"])
        self.bg_mode.currentTextChanged.connect(self._bg_changed)
        self.bg_col = ColorButton("#141024")
        self.bg_col.setFixedHeight(28)
        self.bg_col.changed.connect(self.live_update)
        self.bg_col.setVisible(False)
        ll.addRow("Background", self.bg_mode)
        ll.addRow("", self.bg_col)
        col.addWidget(self.look_box)

        # ---- render ----
        col.addWidget(self._hdr("RENDER"))
        self.model = QtWidgets.QComboBox()
        self.model.addItems(["pro   ~$0.13", "flash   ~$0.04"])
        col.addWidget(self.model)
        self.btn_gen = QtWidgets.QPushButton("Generate Template   ·   paid   (Ctrl+G)")
        self.btn_gen.setObjectName("primary")
        self.btn_gen.clicked.connect(self.generate)
        col.addWidget(self.btn_gen)
        trow = QtWidgets.QHBoxLayout()
        trow.setSpacing(8)
        self.btn_tmpl_load = QtWidgets.QPushButton("Load Template…")
        self.btn_tmpl_load.setToolTip("Reuse a template you already paid for")
        self.btn_tmpl_load.clicked.connect(self.load_template)
        self.btn_tmpl_save = QtWidgets.QPushButton("Save Template…")
        self.btn_tmpl_save.clicked.connect(self.save_template)
        self.btn_tmpl_save.setEnabled(False)
        trow.addWidget(self.btn_tmpl_load)
        trow.addWidget(self.btn_tmpl_save)
        col.addLayout(trow)
        self.btn_variants = QtWidgets.QPushButton("Variants…   ·   free")
        self.btn_variants.clicked.connect(self.show_variants)
        self.btn_variants.setEnabled(False)
        col.addWidget(self.btn_variants)

        # ---- chip / export ----
        self.chip_box = QtWidgets.QGroupBox("Chip")
        cb = QtWidgets.QFormLayout(self.chip_box)
        cb.setSpacing(8)
        self.fill = self._slider(cb, "Fill", 40, 160, 80, lambda v: f"{v}%", self.update_chips)
        self.fill.setToolTip("How much of the chip the art spans. Over 100% crops in.")
        self.nudge_x = self._slider(cb, "Nudge X", -30, 30, 0, lambda v: f"{v}%", self.update_chips)
        self.nudge_y = self._slider(cb, "Nudge Y", -30, 30, 0, lambda v: f"{v}%", self.update_chips)
        self.shape = QtWidgets.QComboBox()
        self.shape.addItems(["circle", "square"])
        self.shape.currentTextChanged.connect(self.update_chips)
        cb.addRow("Shape", self.shape)
        self.chip_bg = QtWidgets.QComboBox()
        self.chip_bg.addItems(["match background", "transparent"])
        self.chip_bg.currentTextChanged.connect(self.update_chips)
        cb.addRow("Surround", self.chip_bg)
        col.addWidget(self.chip_box)

        col.addWidget(self._hdr("EXPORT"))
        self.name = QtWidgets.QLineEdit()
        self.name.setPlaceholderText("file name")
        self.name.setToolTip("What you type wins. Existing files are overwritten.")
        col.addWidget(self.name)
        drow = QtWidgets.QHBoxLayout()
        drow.setSpacing(8)
        self.dir_edit = QtWidgets.QLineEdit(OUT)
        self.btn_dir = QtWidgets.QPushButton("…")
        self.btn_dir.setObjectName("chip")
        self.btn_dir.setFixedWidth(34)
        self.btn_dir.clicked.connect(self._pick_dir)
        drow.addWidget(self.dir_edit, 1)
        drow.addWidget(self.btn_dir)
        col.addLayout(drow)

        szrow = QtWidgets.QHBoxLayout()
        szrow.setSpacing(10)
        self.sizes = {}
        for s, on in ((512, False), (256, True), (128, False), (64, True)):
            c = QtWidgets.QCheckBox(str(s))
            c.setChecked(on)
            self.sizes[s] = c
            szrow.addWidget(c)
        szrow.addStretch(1)
        col.addLayout(szrow)

        self.btn_export = QtWidgets.QPushButton("Export Chips   ·   free   (Ctrl+E)")
        self.btn_export.clicked.connect(self.export)
        self.btn_export.setEnabled(False)
        col.addWidget(self.btn_export)
        erow = QtWidgets.QHBoxLayout()
        erow.setSpacing(8)
        self.btn_copy = QtWidgets.QPushButton("Copy 256")
        self.btn_copy.setToolTip("Copy the 256px chip to the clipboard")
        self.btn_copy.clicked.connect(self.copy_chip)
        self.btn_copy.setEnabled(False)
        self.btn_open = QtWidgets.QPushButton("Open Folder")
        self.btn_open.clicked.connect(self.open_folder)
        erow.addWidget(self.btn_copy)
        erow.addWidget(self.btn_open)
        col.addLayout(erow)

        self.status = QtWidgets.QLabel("Flat lane: one paid render per photo, then style freely.")
        self.status.setObjectName("status")
        self.status.setWordWrap(True)
        self.status.setFont(font(SANS, 9))
        col.addWidget(self.status)
        col.addStretch(1)

        inner = QtWidgets.QWidget()
        inner.setObjectName("leftinner")
        inner.setLayout(col)
        self.leftscroll = QtWidgets.QScrollArea()
        self.leftscroll.setObjectName("leftscroll")
        self.leftscroll.setWidget(inner)
        self.leftscroll.setWidgetResizable(True)
        self.leftscroll.setFixedWidth(392)
        self.leftscroll.setHorizontalScrollBarPolicy(
            QtCore.Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.leftscroll.setFrameShape(QtWidgets.QFrame.Shape.NoFrame)

    def _build_right(self):
        self.preview = QtWidgets.QLabel("Load a photo to begin  ·  or drop one on this window")
        self.preview.setObjectName("preview")
        self.preview.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        self.preview.setMinimumWidth(520)
        self.preview.setFont(font(DISPLAY, 13))

        # live chip strip
        chips = QtWidgets.QWidget()
        chips.setObjectName("strip")
        chips.setFixedHeight(150)
        crow = QtWidgets.QHBoxLayout(chips)
        crow.setContentsMargins(18, 10, 18, 10)
        crow.setSpacing(18)
        cap = QtWidgets.QLabel("CHIP PREVIEW")
        cap.setProperty("role", "hdr")
        cap.setFont(font(DISPLAY, 9, bold=True))
        cap.setStyleSheet("letter-spacing:1px;")
        crow.addWidget(cap)
        crow.addStretch(1)
        self.chip_lbls = {}
        for s in (128, 64, 32):
            holder = QtWidgets.QVBoxLayout()
            holder.setSpacing(4)
            l = QtWidgets.QLabel()
            l.setFixedSize(s, s)
            l.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
            t = QtWidgets.QLabel(f"{s}px")
            t.setFont(font(MONO, 8))
            t.setStyleSheet(f"color:{FAINT};")
            t.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
            holder.addStretch(1)
            holder.addWidget(l, 0, QtCore.Qt.AlignmentFlag.AlignHCenter)
            holder.addWidget(t)
            crow.addLayout(holder)
            self.chip_lbls[s] = l
        crow.addStretch(1)

        # session history
        hist = QtWidgets.QWidget()
        hist.setObjectName("strip")
        hist.setFixedHeight(104)
        hl = QtWidgets.QHBoxLayout(hist)
        hl.setContentsMargins(14, 8, 14, 8)
        hl.setSpacing(10)
        hcap = QtWidgets.QLabel("SESSION")
        hcap.setProperty("role", "hdr")
        hcap.setFont(font(DISPLAY, 9, bold=True))
        hcap.setStyleSheet("letter-spacing:1px;")
        hl.addWidget(hcap)
        self.hist_row = QtWidgets.QHBoxLayout()
        self.hist_row.setSpacing(8)
        hl.addLayout(self.hist_row)
        hl.addStretch(1)
        self.hist_empty = QtWidgets.QLabel("renders you make this session land here")
        self.hist_empty.setFont(font(SANS, 9))
        self.hist_empty.setStyleSheet(f"color:{FAINT};")
        self.hist_row.addWidget(self.hist_empty)

        self.rightcol = QtWidgets.QVBoxLayout()
        self.rightcol.setSpacing(14)
        self.rightcol.addWidget(self.preview, 1)
        self.rightcol.addWidget(chips)
        self.rightcol.addWidget(hist)

    def _shortcuts(self):
        for keys, fn in (("Ctrl+O", self.load_photo), ("Ctrl+G", self.generate),
                         ("Ctrl+E", self.export), ("Ctrl+S", self.swap_colors),
                         ("Ctrl+R", self.randomize_colors), ("Ctrl+D", self.show_variants),
                         ("Ctrl+Shift+C", self.copy_chip)):
            QtGui.QShortcut(QtGui.QKeySequence(keys), self, activated=fn)

    # ------------------------------------------------------------ state/prefs
    def _restore_state(self):
        s = self.state
        self._loading = True
        self.dir_edit.setText(s.get("export_dir") or OUT)
        for p in s.get("recent", []):
            if os.path.exists(p):
                self.recent.addItem(os.path.basename(p), p)
        if self.recent.count() == 0:
            self.recent.addItem("no recent photos", None)
        look = s.get("look") or {}
        if look:
            self.colA.set_hex(look.get("a", E.DEFAULT_A), emit=False)
            self.colB.set_hex(look.get("b", E.DEFAULT_B), emit=False)
            self.mode.setCurrentText(look.get("mode", "linear"))
            self.angle.setValue(int(look.get("angle", 90)))
            self.pos.setValue(int(look.get("pos", 50)))
            self.soft.setValue(int(look.get("soft", 100)))
            self.glow.setValue(int(look.get("glow", 85)))
            self.glow_r.setValue(int(look.get("glow_r", 20)))
            self.thresh.setValue(int(look.get("thresh", 35)))
            self.face_tint.setChecked(bool(look.get("face", True)))
            self.bg_mode.setCurrentText(look.get("bg_mode", "Tether navy"))
            self.bg_col.set_hex(look.get("bg_col", "#141024"), emit=False)
            self.fill.setValue(int(look.get("fill", 80)))
            self.shape.setCurrentText(look.get("shape", "circle"))
        self._loading = False

    def closeEvent(self, e):
        self.state["export_dir"] = self.dir_edit.text().strip()
        self.state["look"] = {
            "a": self.colA.hex(), "b": self.colB.hex(), "mode": self.mode.currentText(),
            "angle": self.angle.value(), "pos": self.pos.value(), "soft": self.soft.value(),
            "glow": self.glow.value(), "glow_r": self.glow_r.value(),
            "thresh": self.thresh.value(), "face": self.face_tint.isChecked(),
            "bg_mode": self.bg_mode.currentText(), "bg_col": self.bg_col.hex(),
            "fill": self.fill.value(), "shape": self.shape.currentText(),
        }
        E.save_state(self.state)
        super().closeEvent(e)

    def _remember_photo(self, path):
        recent = [p for p in self.state.get("recent", []) if p != path]
        recent.insert(0, path)
        self.state["recent"] = recent[:8]
        self.recent.blockSignals(True)
        self.recent.clear()
        for p in self.state["recent"]:
            self.recent.addItem(os.path.basename(p), p)
        self.recent.setCurrentIndex(0)
        self.recent.blockSignals(False)

    # ---------------------------------------------------------------- presets
    def _reload_presets(self):
        self.presets = E.load_presets()
        self.preset.blockSignals(True)
        self.preset.clear()
        self.preset.addItem("presets…", None)
        for k in self.presets:
            self.preset.addItem(k, k)
        self.preset.blockSignals(False)

    def _preset_pick(self, _idx):
        key = self.preset.currentData()
        if not key:
            return
        a, b = self.presets[key]
        self.colA.set_hex(a, emit=False)
        self.colB.set_hex(b, emit=False)
        self.live_update()

    def _preset_save(self):
        name, ok = QtWidgets.QInputDialog.getText(self, "Save preset", "Preset name:")
        name = name.strip()
        if ok and name:
            E.save_preset(name, self.colA.hex(), self.colB.hex())
            self._reload_presets()
            self.preset.setCurrentText(name)
            self.status.setText(f"Saved preset “{name}”.")

    def _preset_delete(self):
        key = self.preset.currentData()
        if key and key not in E.BUILTIN_PRESETS:
            E.delete_preset(key)
            self._reload_presets()
            self.status.setText(f"Deleted preset “{key}”.")
        elif key:
            self.status.setText("Built-in presets can't be deleted.")

    def swap_colors(self):
        a, b = self.colA.hex(), self.colB.hex()
        self.colA.set_hex(b, emit=False)
        self.colB.set_hex(a, emit=False)
        self.live_update()

    def randomize_colors(self):
        a, b = E.random_pair(self.rng)
        self.colA.set_hex(a, emit=False)
        self.colB.set_hex(b, emit=False)
        self.live_update()

    # ------------------------------------------------------------------ photo
    def load_photo(self):
        start = os.path.dirname(self.photo_path) if self.photo_path else HERE
        path, _ = QtWidgets.QFileDialog.getOpenFileName(
            self, "Choose a photo", start, "Images (*.png *.jpg *.jpeg *.webp *.bmp)")
        if path:
            self.set_photo(path)

    def _recent_pick(self, _idx):
        path = self.recent.currentData()
        if path and os.path.exists(path):
            self.set_photo(path)

    def set_photo(self, path):
        self.photo_path = path
        self.template_data = self.template_small = None
        self.view_img = self.render_img = None
        self.btn_export.setEnabled(False)
        self.btn_copy.setEnabled(False)
        self.btn_variants.setEnabled(False)
        self.btn_tmpl_save.setEnabled(False)
        self.photo_lbl.setText(os.path.basename(path))
        self.name.setText(os.path.splitext(os.path.basename(path))[0])
        self._clear_chips()
        self._remember_photo(path)
        self.preview.setPixmap(QtGui.QPixmap(path).scaled(
            self.preview.size(), QtCore.Qt.AspectRatioMode.KeepAspectRatio,
            QtCore.Qt.TransformationMode.SmoothTransformation))

    def _pick_dir(self):
        d = QtWidgets.QFileDialog.getExistingDirectory(
            self, "Export folder", self.dir_edit.text().strip() or OUT)
        if d:
            self.dir_edit.setText(d)

    # -------------------------------------------------------------- drag/drop
    def _drop_path(self, event):
        for url in event.mimeData().urls():
            p = url.toLocalFile()
            if p.lower().endswith(IMG_EXT):
                return p
        return None

    def dragEnterEvent(self, e):
        if e.mimeData().hasUrls() and self._drop_path(e):
            e.acceptProposedAction()

    dragMoveEvent = dragEnterEvent

    def dropEvent(self, e):
        p = self._drop_path(e)
        if p:
            self.set_photo(p)
            self.status.setText(f"Loaded {os.path.basename(p)} by drop.")
            e.acceptProposedAction()

    # ------------------------------------------------------------------- lane
    def on_lane(self, *_):
        flat = self.lane_flat.isChecked()
        self.grad_box.setEnabled(flat)
        self.look_box.setEnabled(flat)
        self.btn_variants.setEnabled(flat and self.template_data is not None)
        self.btn_tmpl_save.setEnabled(flat and self.template_data is not None)
        self.btn_tmpl_load.setEnabled(flat)
        self.btn_gen.setText("Generate Template   ·   paid   (Ctrl+G)" if flat
                             else "Generate   ·   paid   (Ctrl+G)")
        if flat and self.template_data is not None:
            self.live_update()

    def model_key(self):
        return "pro" if self.model.currentIndex() == 0 else "flash"

    # ------------------------------------------------ live local recolor
    def _bg_hex(self):
        m = self.bg_mode.currentText()
        if m == "Transparent":
            return None
        return E.DEFAULT_BG if m == "Tether navy" else self.bg_col.hex()

    def _bg_changed(self, _t):
        self.bg_col.setVisible(self.bg_mode.currentText() == "Custom")
        self.live_update()

    def _look_kwargs(self, override=None):
        mode, angle, pos = (self.mode.currentText(), float(self.angle.value()),
                            self.pos.value() / 100.0)
        if override:
            mode, angle, pos = override[0], float(override[1]), float(override[2])
        return dict(
            color_a=self.colA.hex(), color_b=self.colB.hex(), mode=mode, angle_deg=angle,
            position=pos, glow_strength=self.glow.value() / 100.0,
            face_tint=self.face_tint.isChecked(), threshold=self.thresh.value() / 100.0,
            glow_radius=self.glow_r.value() / 1000.0, softness=self.soft.value() / 100.0,
            bg=self._bg_hex())

    def live_update(self, *_):
        """Coalesce bursts: one render per event-loop pass, so a fast drag never
        queues frames and lags behind the mouse."""
        if self._loading or self._pending:
            return
        if not (self.lane_flat.isChecked() and self.template_small):
            return
        self._pending = True
        QtCore.QTimer.singleShot(0, self._render)

    def _render(self):
        self._pending = False
        if not (self.lane_flat.isChecked() and self.template_small):
            return
        self.view_img = E.recolor_flat(self.template_small, **self._look_kwargs())
        self._show(self.view_img)
        self.update_chips()

    def export_image(self):
        """Full-res art for export/clipboard. Flat lane re-renders at 1:1."""
        if self.lane_flat.isChecked() and self.template_data:
            return E.recolor_flat(self.template_data, **self._look_kwargs())
        return self.render_img

    def _show(self, img):
        self.preview.setPixmap(pil_to_pixmap(img).scaled(
            self.preview.size(), QtCore.Qt.AspectRatioMode.KeepAspectRatio,
            QtCore.Qt.TransformationMode.SmoothTransformation))

    # ------------------------------------------------------------ chip preview
    def _chip_kwargs(self, size):
        surround = None if self.chip_bg.currentIndex() == 1 else self._bg_hex()
        return dict(size=size, fill=self.fill.value() / 100.0,
                    offset=(self.nudge_x.value() / 100.0, self.nudge_y.value() / 100.0),
                    shape=self.shape.currentText(), bg=surround)

    def make_chip(self, size, src=None):
        return E.circular_chip(src or self.view_img, **self._chip_kwargs(size))

    def update_chips(self, *_):
        if self._loading or self.view_img is None:
            return
        for s, lbl in self.chip_lbls.items():
            lbl.setPixmap(pil_to_pixmap(self.make_chip(s)))

    def _clear_chips(self):
        for lbl in self.chip_lbls.values():
            lbl.clear()

    # -------------------------------------------------------------- variants
    def show_variants(self):
        if not (self.lane_flat.isChecked() and self.template_small):
            self.status.setText("Variants need a flat-lane template first.")
            return
        QtWidgets.QApplication.setOverrideCursor(QtCore.Qt.CursorShape.WaitCursor)
        try:
            def render(params):
                img = E.recolor_flat(self.template_small, **self._look_kwargs(params))
                return img.resize((132, 132))
            d = VariantDialog(render, self)
        finally:
            QtWidgets.QApplication.restoreOverrideCursor()
        if d.exec() == QtWidgets.QDialog.DialogCode.Accepted and d.picked:
            mode, angle, pos = d.picked
            self.mode.setCurrentText(mode)
            self.angle.setValue(int(angle))
            self.pos.setValue(int(pos * 100))
            self.live_update()
            self.status.setText(f"Adopted {mode} · {int(angle)}° · {int(pos * 100)}%.")

    # -------------------------------------------------------------- templates
    def save_template(self):
        if not self.template_data or "raw" not in self.template_data:
            return
        stem = (self.name.text().strip() or "template")
        path, _ = QtWidgets.QFileDialog.getSaveFileName(
            self, "Save template", os.path.join(E.TEMPLATE_DIR, f"{stem}.png"), "PNG (*.png)")
        if path:
            self.template_data["raw"].save(path)
            self.status.setText(f"Template saved → {path}")

    def load_template(self):
        os.makedirs(E.TEMPLATE_DIR, exist_ok=True)
        path, _ = QtWidgets.QFileDialog.getOpenFileName(
            self, "Load a template", E.TEMPLATE_DIR, "Images (*.png *.jpg *.jpeg)")
        if not path:
            return
        img = Image.open(path).convert("RGB")
        self._adopt_template(img, os.path.splitext(os.path.basename(path))[0])
        self.status.setText(f"Loaded template {os.path.basename(path)} - free, no render spent.")

    def _adopt_template(self, img, stem=None):
        self.template_data = E.prepare_template(img)
        self.template_data["raw"] = img
        small = img if max(img.size) <= PREVIEW_PX else img.resize(
            (PREVIEW_PX, PREVIEW_PX), Image.LANCZOS)
        self.template_small = E.prepare_template(small)
        self.render_img = None
        self.lane_flat.setChecked(True)
        if stem and not self.photo_path:
            self.name.setText(stem)
        self.btn_export.setEnabled(True)
        self.btn_copy.setEnabled(True)
        self.btn_variants.setEnabled(True)
        self.btn_tmpl_save.setEnabled(True)
        self._render()          # synchronous: callers read view_img right after

    # -------------------------------------------------------------- PIN gate
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

    # ------------------------------------------------------------ paid render
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
        stem = os.path.splitext(os.path.basename(self.photo_path))[0]
        archived = E.archive_template(img, stem if self.lane_flat.isChecked()
                                      else f"{stem}_16bit")
        if self.lane_flat.isChecked():
            self._adopt_template(img)
            self._busy(False, "Template ready. Play with colors and gradient live - free. "
                              f"Raw saved to {os.path.basename(archived)}.")
            self._add_history("flat template")
        else:
            self.template_data = self.template_small = None
            self.render_img = self.view_img = img.convert("RGBA")
            self._show(self.view_img)
            self.update_chips()
            self._busy(False, "Rendered. Change colors and Generate to re-roll. "
                              f"Raw saved to {os.path.basename(archived)}.")
            self._add_history("16-bit")
        self.btn_export.setEnabled(True)
        self.btn_copy.setEnabled(True)

    def _gen_fail(self, msg):
        self._busy(False, f"Render failed: {msg}")

    def _busy(self, on, msg):
        for w in (self.btn_gen, self.btn_photo, self.lane_flat, self.lane_16):
            w.setEnabled(not on)
        self.status.setText(msg)

    # -------------------------------------------------------------- history
    def _add_history(self, label):
        """Snapshot the whole render state so a paid render survives any later change."""
        if self.hist_empty is not None:
            self.hist_empty.setParent(None)
            self.hist_empty = None
        snap = {"label": label, "view": self.view_img.copy(), "data": self.template_data,
                "small": self.template_small, "render": self.render_img,
                "name": self.name.text().strip()}
        b = QtWidgets.QToolButton()
        b.setIconSize(QtCore.QSize(64, 64))
        b.setIcon(QtGui.QIcon(pil_to_pixmap(snap["view"].resize((64, 64)))))
        b.setToolTip(f"{label} · {snap['name'] or 'unnamed'} · click to restore")
        b.setCursor(QtCore.Qt.CursorShape.PointingHandCursor)
        b.setStyleSheet(f"background:{PANEL}; border:1px solid {LINE}; border-radius:8px; padding:3px;")
        b.clicked.connect(lambda _=False, s=snap: self._restore(s))
        self.hist_row.addWidget(b)
        self.history.append(snap)

    def _restore(self, snap):
        self.template_data, self.template_small = snap["data"], snap["small"]
        self.render_img, self.view_img = snap["render"], snap["view"]
        if snap["name"]:
            self.name.setText(snap["name"])
        if snap["data"]:
            self.lane_flat.setChecked(True)
            self.live_update()
        else:
            self.lane_16.setChecked(True)
            self._show(self.view_img)
            self.update_chips()
        self.btn_export.setEnabled(True)
        self.btn_copy.setEnabled(True)
        self.btn_variants.setEnabled(snap["data"] is not None)
        self.btn_tmpl_save.setEnabled(snap["data"] is not None)
        self.status.setText(f"Restored the {snap['label']} render from this session.")

    # -------------------------------------------------------------- export
    def export(self):
        if self.view_img is None:
            return
        sizes = [s for s, c in self.sizes.items() if c.isChecked()]
        if not sizes:
            self.status.setText("Tick at least one chip size.")
            return
        stem = self.name.text().strip()
        if not stem:
            self.status.setText("Give the file a name first.")
            return
        d = self.dir_edit.text().strip() or OUT
        QtWidgets.QApplication.setOverrideCursor(QtCore.Qt.CursorShape.WaitCursor)
        try:
            os.makedirs(d, exist_ok=True)
            src = self.export_image()
            written = []
            for size in sorted(sizes, reverse=True):
                path = os.path.join(d, f"{stem}_c{size}.png")
                self.make_chip(size, src).save(path)          # typed name wins, overwrite
                written.append(os.path.basename(path))
        except OSError as e:
            self.status.setText(f"Export failed: {e}")
            return
        finally:
            QtWidgets.QApplication.restoreOverrideCursor()
        self.state["export_dir"] = d
        self.status.setText(f"Exported {', '.join(written)}  →  {d}")

    def copy_chip(self):
        if self.view_img is None:
            return
        QtWidgets.QApplication.clipboard().setPixmap(
            pil_to_pixmap(self.make_chip(256, self.export_image())))
        self.status.setText("256px chip copied to the clipboard.")

    def open_folder(self):
        d = self.dir_edit.text().strip() or OUT
        os.makedirs(d, exist_ok=True)
        QtGui.QDesktopServices.openUrl(QtCore.QUrl.fromLocalFile(d))

    def resizeEvent(self, e):
        super().resizeEvent(e)
        if self.view_img is not None:
            self._show(self.view_img)


if __name__ == "__main__":
    app = QtWidgets.QApplication(sys.argv)
    app.setStyle("Fusion")
    app.setFont(font(SANS, 10))
    app.setStyleSheet(QSS)
    w = Main()
    w.show()
    sys.exit(app.exec())
