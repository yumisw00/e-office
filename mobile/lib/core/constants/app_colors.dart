import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary (Base color provided)
  static const Color primary = Color(0xFF0F7D8A);
  
  // Turunan / Skala Warna (Shades & Tints)
  static const Color primaryLight = Color(0xFF14A3B4); // Lebih terang untuk aksen/hover
  static const Color primaryDark = Color(0xFF0A545E);  // Lebih gelap untuk kontras tinggi/header
  static const Color surface = Color(0xFFF4F8F8);       // Background netral dengan hint kebiruan
  static const Color background = Color(0xFFFFFFFF);    // Background utama
  static const Color textPrimary = Color(0xFF0D1B1E);   // Teks utama kontras tinggi
  static const Color textSecondary = Color(0xFF5A7175); // Teks sekunder/muted

  // Status Colors (Optional but good for semantic design)
  static const Color success = Color(0xFF2E7D32);
  static const Color error = Color(0xFFD32F2F);
  static const Color warning = Color(0xFFFFA000);
  static const Color info = Color(0xFF1976D2);
}
