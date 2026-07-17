import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../../../../core/theme/app_brand_assets.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_styles.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/widgets/auth_welcome_background.dart';

class IntroPage extends ConsumerWidget {
  const IntroPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isLoading && auth.isAuth) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/');
      });
    }

    return Scaffold(
      body: Stack(
        children: [
          const AuthWelcomeBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 140),
              child: Column(
                children: [
                  _buildHeader(context),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Column(
                      children: [
                        const SizedBox(height: 12),
                        const _IntroHeroLogo(),
                        const _IntroVideo(),
                        const SizedBox(height: 24),
                        const _IntroTextSection(),
                        const SizedBox(height: 32),
                        const _StoreTypesHighlight(),
                        const _HeroStats(),
                        const _PersonasSection(),
                        const SizedBox(height: 48),
                        const _PillarsSection(),
                        const SizedBox(height: 40),
                        const _PrizeHighlights(),
                        const SizedBox(height: 40),
                        FadeInUp(
                          child: const Text(
                            'انضم الآن — مجاني · بدون التزام · جوائز داخل البلد',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const _BottomStickyActions(),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.75),
              borderRadius: BorderRadius.circular(100),
              border: Border.all(color: Colors.white.withOpacity(0.7)),
              boxShadow: AppStyles.glassShadow,
            ),
            child: const Row(
              children: [
                Icon(LucideIcons.sparkles, size: 14, color: Colors.amber),
                SizedBox(width: 8),
                Text(
                  'Win GoldenStore',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1F2937),
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => context.push('/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white.withOpacity(0.8),
              foregroundColor: const Color(0xFF374151),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: Size.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
                side: const BorderSide(color: Color(0xFFE5E7EB), width: 0.8),
              ),
            ),
            child: const Text(
              'لدي حساب',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IntroHeroLogo extends StatelessWidget {
  const _IntroHeroLogo();

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      child: Center(
        child: SizedBox(
          height: 160,
          width: 160,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [
                      Color(0x66FFC1C1),
                      Color(0x59C1D9FF),
                      Color(0x66C1FFD9),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white.withOpacity(0.1),
                      blurRadius: 40,
                      spreadRadius: 20,
                    ),
                  ],
                ),
              ),
              const BrandLogo.full(width: 110, height: 110),
            ],
          ),
        ),
      ),
    );
  }
}

class _IntroVideo extends StatefulWidget {
  const _IntroVideo();

  @override
  State<_IntroVideo> createState() => _IntroVideoState();
}

class _IntroVideoState extends State<_IntroVideo> {
  bool _playing = false;
  late YoutubePlayerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = YoutubePlayerController(
      initialVideoId: 'dQw4w9WgXcQ',
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            colors: [Colors.red, Colors.amber, Colors.purple],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(2),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              AspectRatio(
                aspectRatio: 16 / 10,
                child: _playing
                    ? YoutubePlayer(
                        controller: _controller,
                        showVideoProgressIndicator: true,
                      )
                    : GestureDetector(
                        onTap: () => setState(() => _playing = true),
                        child: Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFF1A0A0A), Color(0xFF120818), Color(0xFF0A0A12)],
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.amber.withOpacity(0.4), width: 2),
                                ),
                                child: const Icon(LucideIcons.play, color: Colors.amber, size: 36),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'اضغط لمشاهدة الفيديو',
                                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900),
                              ),
                              const Text(
                                'يُحمّل عند الطلب — أسرع للجوال',
                                style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: Colors.black.withOpacity(0.6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(LucideIcons.play, size: 14, color: Colors.amber),
                        SizedBox(width: 8),
                        Text(
                          'شاهد كيف تعمل المنصة في 60 ثانية',
                          style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'مجاني',
                        style: TextStyle(color: Color(0xFFFECACA), fontSize: 10, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IntroTextSection extends StatelessWidget {
  const _IntroTextSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FadeInUp(
          delay: const Duration(milliseconds: 100),
          child: const Text(
            'كل ما تحتاجه موجود هنا',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
              fontFamily: 'Cairo',
            ),
          ),
        ),
        const SizedBox(height: 12),
        FadeInUp(
          delay: const Duration(milliseconds: 200),
          child: ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [Colors.red, Colors.purple, Colors.blue],
            ).createShader(bounds),
            child: const Text(
              'حوّل كل عملية شراء إلى فرصة ربح',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _StoreTypesHighlight extends StatelessWidget {
  const _StoreTypesHighlight();

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      delay: const Duration(milliseconds: 300),
      child: Container(
        margin: const EdgeInsets.only(bottom: 32),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.75),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: AppStyles.glassShadow,
        ),
        child: Column(
          children: [
            const _HighlightItem(text: 'الحصول على نقاط من المتاجر المعتمدة داخل التطبيق'),
            const SizedBox(height: 10),
            const _HighlightItem(text: 'أكثر من 30 نوع متجر'),
            const SizedBox(height: 12),
            Text(
              'مجوهرات · ملابس · أحذية · أجهزة كهربائية · ماركتات · مطاعم …والمزيد',
              style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HighlightItem extends StatelessWidget {
  final String text;
  const _HighlightItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('✅', style: TextStyle(fontSize: 14)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF374151),
            ),
          ),
        ),
      ],
    );
  }
}

class _HeroStats extends StatelessWidget {
  const _HeroStats();

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      delay: const Duration(milliseconds: 400),
      child: Row(
        children: [
          _buildStatCard(LucideIcons.tag, '+1000', 'عرض نشط'),
          const SizedBox(width: 12),
          _buildStatCard(LucideIcons.gift, 'جوائز', 'حقيقية'),
          const SizedBox(width: 12),
          _buildStatCard(LucideIcons.coins, 'نقاط', 'تتراكم'),
        ],
      ),
    );
  }

  Widget _buildStatCard(IconData icon, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: Colors.amber),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}

class _PersonasSection extends StatelessWidget {
  const _PersonasSection();

  @override
  Widget build(BuildContext context) {
    final personas = [
      {
        'icon': LucideIcons.trophy,
        'title': 'محب الجوائز',
        'desc': 'اربح سيارات، كاش، وجوائز حقيقية مع كل نقطة.',
        'gradient': [const Color(0xFFF59E0B), const Color(0xFFEA580C)]
      },
      {
        'icon': LucideIcons.shoppingBag,
        'title': 'محب التسوق',
        'desc': 'تسوق من متاجر موثوقة مع توصيل وتجربة سلسة.',
        'gradient': [AppColors.rose, const Color(0xFFE11D48)]
      },
      {
        'icon': LucideIcons.percent,
        'title': 'محب العروض',
        'desc': 'اكتشف أفضل الخصومات قبل الجميع في مكان واحد.',
        'gradient': [AppColors.violet, const Color(0xFF7C3AED)]
      },
      {
        'icon': LucideIcons.users,
        'title': 'تبيع أغراضك',
        'desc': 'اعرض غراضك للبيع أو التبديل داخل سوق المستخدمين.',
        'gradient': [const Color(0xFF06B6D4), const Color(0xFF2563EB)]
      },
      {
        'icon': LucideIcons.trendingDown,
        'title': 'تتابع الأسعار',
        'desc': 'راقب العروض والمتاجر ولا تفوّت فرصة التوفير.',
        'gradient': [const Color(0xFF10B981), const Color(0xFF14B8A6)]
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 48),
        FadeInUp(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'مناسبة لك — مهما كان هدفك',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                  ),
                  Text(
                    'اختر مسارك… المنصة تخدم الجميع.',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                  ),
                ],
              ),
              const Row(
                children: [
                  Text('مرّر', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  SizedBox(width: 4),
                  Icon(LucideIcons.chevronRight, size: 12, color: Colors.grey),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 180,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            itemCount: personas.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final p = personas[index];
              return Container(
                width: 240,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: AppStyles.glassShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: p['gradient'] as List<Color>,
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(p['icon'] as IconData, size: 22, color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      p['title'] as String,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      p['desc'] as String,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _PillarsSection extends StatelessWidget {
  const _PillarsSection();

  @override
  Widget build(BuildContext context) {
    final pillars = [
      {
        'icon': LucideIcons.tag,
        'title': 'العروض',
        'headline': 'كل العروض في مكان واحد',
        'desc': 'تصفح عروض المطاعم، الأزياء، الإلكترونيات والمزيد — مرتّبة حسب اهتماماتك ومنطقتك.',
        'color': AppColors.rose,
      },
      {
        'icon': LucideIcons.truck,
        'title': 'التسوق',
        'headline': 'اشتري بثقة وسرعة',
        'desc': 'اطلب من المتاجر مباشرة، تابع طلبك، واستمتع بتجربة تسوق حديثة من جوالك.',
        'color': Colors.orange,
      },
      {
        'icon': LucideIcons.shoppingBag,
        'title': 'سوق المستخدمين',
        'headline': 'بيع · بدل · اعرض غراضك',
        'desc': 'سوق مجتمعي يربط البائع بالمشتري — بيع أغراضك أو اكتشف صفقات مميزة.',
        'color': Colors.cyan,
      },
      {
        'icon': LucideIcons.medal,
        'title': 'الجوائز',
        'headline': 'مسابقات وعجلة ومسار إنجازات',
        'desc': 'شارك في المسابقات، لف عجلة الحظ، وافتح جوائزك على مسار النقاط.',
        'color': Colors.amber,
      },
      {
        'icon': LucideIcons.coins,
        'title': 'النقاط',
        'headline': 'كل تفاعل يقربك للفوز',
        'desc': 'الشراء، الدعوات، الأكواد، والمشاركة — كلها تمنحك نقاطاً ترتقي بمستواك.',
        'color': AppColors.violet,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FadeInUp(
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ماذا ستجد هنا؟',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              Text(
                'كل ما تحتاجه — بأسلوب سريع ومحفّز.',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...pillars.map((item) => FadeInUp(
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: AppStyles.glassShadow,
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: 0,
                      top: 0,
                      bottom: 0,
                      child: Container(
                        width: 4,
                        decoration: BoxDecoration(
                          color: item['color'] as Color,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(right: 16.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: (item['color'] as Color).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: (item['color'] as Color).withOpacity(0.3)),
                            ),
                            child: Icon(item['icon'] as IconData, size: 22, color: (item['color'] as Color).withOpacity(0.8)),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['title'] as String,
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item['headline'] as String,
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, height: 1.2),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  item['desc'] as String,
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )),
      ],
    );
  }
}

class _PrizeHighlights extends StatelessWidget {
  const _PrizeHighlights();

  @override
  Widget build(BuildContext context) {
    final prizes = [
      {'icon': '🚗', 'label': 'سيارات'},
      {'icon': '🏠', 'label': 'جوائز عقارية'},
      {'icon': '💵', 'label': 'كاش'},
      {'icon': '📱', 'label': 'أجهزة ذكية'},
      {'icon': '🎁', 'label': 'هدايا يومية'},
    ];

    return FadeInUp(
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: const Color(0xFFFDE68A)),
          gradient: const LinearGradient(
            colors: [Color(0xFFFEF3C7), Color(0xFFFEE2E2), Color(0xFFEDE9FE)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: AppStyles.glassShadow,
        ),
        child: Column(
          children: [
            const Row(
              children: [
                Icon(LucideIcons.gift, size: 24, color: Colors.amber),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'جوائز تستحق المشاركة',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                    ),
                    Text(
                      'مسابقات · عجلة حظ · مسار إنجازات',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF4B5563)),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: prizes.map((p) => Column(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white),
                        ),
                        child: Text(p['icon']!, style: const TextStyle(fontSize: 24)),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        p['label']!,
                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF374151)),
                      ),
                    ],
                  )).toList(),
            ),
            const SizedBox(height: 24),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _PrizeFooterItem(icon: LucideIcons.star, label: 'نقاط تتراكم'),
                SizedBox(width: 16),
                _PrizeFooterItem(icon: LucideIcons.circleDot, label: 'عجلة يومية'),
                SizedBox(width: 16),
                _PrizeFooterItem(icon: LucideIcons.sparkles, label: 'مسار إنجازات'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PrizeFooterItem extends StatelessWidget {
  final IconData icon;
  final String label;
  const _PrizeFooterItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 12, color: Colors.amber.shade700),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.amber.shade900),
        ),
      ],
    );
  }
}

class _BottomStickyActions extends StatelessWidget {
  const _BottomStickyActions();

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.fromLTRB(
          20,
          16,
          20,
          16 + MediaQuery.of(context).padding.bottom,
        ),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9),
          border: const Border(top: BorderSide(color: Color(0xFFE5E7EB))),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => context.push('/register'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
                  padding: EdgeInsets.zero,
                ),
                child: Ink(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFDC2626), Color(0xFFEF4444), Color(0xFFF59E0B)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Container(
                    alignment: Alignment.center,
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'ابدأ مجاناً — أنشئ حسابك',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                        ),
                        SizedBox(width: 8),
                        Icon(LucideIcons.chevronLeft, size: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => context.push('/login'),
              child: const Text(
                'لدي حساب بالفعل — تسجيل الدخول',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
