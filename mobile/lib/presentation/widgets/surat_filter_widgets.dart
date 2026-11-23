import 'package:e_office_mobile/core/utils/haptic_helper.dart';
import 'package:flutter/material.dart';

class SuratSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final VoidCallback? onClear;
  final EdgeInsetsGeometry padding;
  final bool? hasText;

  const SuratSearchBar({
    super.key,
    required this.controller,
    required this.hintText,
    this.onChanged,
    this.onSubmitted,
    this.onClear,
    this.padding = const EdgeInsets.fromLTRB(16, 8, 16, 6),
    this.hasText,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final showClear = hasText ?? controller.text.isNotEmpty;

    return Container(
      color: Colors.transparent,
      padding: padding,
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade500),
          prefixIcon: const Icon(Icons.search, size: 20),
          suffixIcon: showClear
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () {
                    HapticHelper.lightImpact();
                    controller.clear();
                    onClear?.call();
                  },
                )
              : null,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 10,
          ),
          filled: true,
          fillColor: isDark
              ? theme.colorScheme.surfaceContainerHighest
              : Colors.grey.shade100,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(28),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(28),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(28),
            borderSide: BorderSide(
              color: theme.colorScheme.primary.withValues(alpha: 0.5),
              width: 1.0,
            ),
          ),
        ),
        textInputAction: TextInputAction.search,
        onChanged: onChanged,
        onSubmitted: onSubmitted,
      ),
    );
  }
}

class SuratFilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onSelected;
  final double fontSize;
  final EdgeInsetsGeometry? padding;

  const SuratFilterChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onSelected,
    this.fontSize = 12,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final isDark = theme.brightness == Brightness.dark;

    final unselectedBgColor = isDark
        ? theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3)
        : Colors.transparent;
    final unselectedBorderColor = isDark
        ? Colors.white.withValues(alpha: 0.15)
        : Colors.grey.shade300;
    final unselectedTextColor = isDark
        ? theme.colorScheme.onSurface
        : theme.colorScheme.onSurfaceVariant;

    return ChoiceChip(
      showCheckmark: false,
      selected: selected,
      label: Text(
        label,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          color: selected ? Colors.white : unselectedTextColor,
        ),
      ),
      backgroundColor: unselectedBgColor,
      selectedColor: primary,
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      shape: StadiumBorder(
        side: BorderSide(
          color: selected ? primary : unselectedBorderColor,
          width: 1,
        ),
      ),
      onSelected: (_) => onSelected(),
    );
  }
}

Map<String, int> computeJenisSuratCounts(Iterable<String?> jenisValues) {
  final counts = <String, int>{'semua': 0};
  for (final raw in jenisValues) {
    counts['semua'] = (counts['semua'] ?? 0) + 1;
    final normalized = (raw ?? '').trim().toLowerCase();
    if (normalized.isNotEmpty) {
      counts[normalized] = (counts[normalized] ?? 0) + 1;
    }
  }
  return counts;
}

class JenisSuratFilterRow extends StatelessWidget {
  final String selectedValue;
  final List<Map<String, String>> options;
  final Map<String, int> counts;
  final ValueChanged<String> onSelected;
  final List<String> fallbackJenisValues;

  const JenisSuratFilterRow({
    super.key,
    required this.selectedValue,
    required this.options,
    required this.counts,
    required this.onSelected,
    this.fallbackJenisValues = const [],
  });

  List<Map<String, String>> _effectiveOptions() {
    if (options.isNotEmpty) return options;
    final seen = <String>{};
    final derived = <Map<String, String>>[];
    for (final raw in fallbackJenisValues) {
      final clean = raw.trim();
      if (clean.isEmpty) continue;
      final key = clean.toLowerCase();
      if (!seen.add(key)) continue;
      derived.add({'value': clean, 'label': clean});
    }
    return derived;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final effectiveOptions = _effectiveOptions();
    final selectedLower = selectedValue.trim().toLowerCase();

    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.fromLTRB(16, 2, 16, 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            Text(
              'Jenis Surat',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isDark
                    ? theme.colorScheme.onSurfaceVariant
                    : Colors.blueGrey.shade700,
              ),
            ),
            Container(
              width: 1,
              height: 16,
              margin: const EdgeInsets.symmetric(horizontal: 10),
              color: isDark
                  ? Colors.white.withValues(alpha: 0.16)
                  : Colors.grey.shade300,
            ),
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: SuratFilterChip(
                label: 'Semua (${counts['semua'] ?? 0})',
                selected: selectedLower == 'semua',
                fontSize: 11,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                onSelected: () => onSelected('semua'),
              ),
            ),
            ...effectiveOptions.map((opt) {
              final value = (opt['value'] ?? '').trim();
              final label = (opt['label'] ?? value).trim();
              final count = counts[value.toLowerCase()] ?? 0;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: SuratFilterChip(
                  label: '$label ($count)',
                  selected: selectedLower == value.toLowerCase(),
                  fontSize: 11,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  onSelected: () => onSelected(value),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
