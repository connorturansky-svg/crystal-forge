# Cogs & Gears — add a tactile top grip

1. Open **Cogs & Gears** in Studio. Choose a wheel type, teeth, body thickness and (if needed) measured shaft bore.
2. In **Design → Top handles & tactile knobs**, choose a grip starting point. Select **Add selected grip**, or double-click an exposed flat position on the 3D top face to place it there.
3. Click a grip to select it, then drag to reposition. Alternatively, use exact **X** and **Z** fields; dragging is optional. Red preview means the strengthened base overlaps a shaft opening, other window, neighbouring grip or outer edge; the last valid position is retained.
4. Adjust **Width**, **Depth** and **Height** independently. **Rotation** changes grip orientation.
5. Profile presets include Straight taper, Bulbous 2/3 (widens toward its upper two-thirds and narrows again), Hourglass, Mushroom, Rounded cap and Flat. Change profile without deleting the grip.
6. Surface texture options are Smooth, Vertical ribs, Scalloped, Diamond knurl and Horizontal grooves. These represent actual printable geometry, so consider your nozzle and slicer.
7. Base join **Round** is a curved, spreading shoulder; **Chamfer** is an angled 45° shoulder. Increase the join size to strengthen the root, subject to available stock and actual test prints.
8. For a centred dial with a shaft bore, use X = 0, Z = 0. During preparation the original central shaft bore is reopened through the top control. Off-centre spindles must clear the central bore.
9. Enter **Build → Print Centre → Prepare** and inspect the resulting STL/3MF in Cura. A colourful preview alone is not a printable joined mesh.

**Keyboard and accessibility:** Tab through labelled controls, type measured values and press Tab to apply. Messages explain invalid positions; the operation does not depend on colour alone. Editable source data remains in saved project JSON.

To reuse a setup, save the project in Library and choose **Save as reusable template** on its saved version. Open saved versions from their project folders. A saved version retains the grip settings from the moment it was saved.

**Current scope:** All grips are integral printable pieces, not separately freely spinning bearing-mounted handles. Arbitrary saved Control Cap-to-Gear fusion, raised/curved mounting faces and general-purpose per-edge CAD fillets are follow-on work; do not assume a printed grip is rated for hand force or safe for young children.
