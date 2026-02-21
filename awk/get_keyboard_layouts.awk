/^Keyboards:/ { k=1; next } # Start processing after "Keyboards:" line
k && /^$/     { exit }      # Stop processing at the first empty line after "Keyboards:"
k && /active keymap:/ {     # Process lines containing "active keymap:"
  sub(/^.*: /,"")           # Remove everything up to and including ": "
  count[$0]++
}
END {
  for (m in count)
    print count[m], m
}