import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_image.dart';
import '../../../auth/presentation/providers/auth_gate_provider.dart';
import '../../../auth/utils/auth_gate_messages.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../data/models/competition_model.dart';
import '../providers/competitions_providers.dart';

class CompetitionDetailPage extends ConsumerStatefulWidget {
  final String id;

  const CompetitionDetailPage({super.key, required this.id});

  @override
  ConsumerState<CompetitionDetailPage> createState() =>
      _CompetitionDetailPageState();
}

class _CompetitionDetailPageState extends ConsumerState<CompetitionDetailPage> {
  int _entries = 1;
  bool _joining = false;
  bool _success = false;
  String? _joinError;
  CompetitionModel? _optimistic;

  int get _userPoints =>
      (ref.watch(authProvider).user?['points'] as num?)?.toInt() ?? 0;

  Future<void> _join(CompetitionModel competition) async {
    final isAuth = ref.read(authProvider).isAuth;
    if (!isAuth) {
      ref.read(authGateProvider.notifier).runWithAuth(
            () => ref.read(verificationGateProvider.notifier).runWithVerification(
                  () => _performJoin(competition),
                ),
            message: AuthGateMessages.pointsRewards,
          );
      return;
    }
    ref.read(verificationGateProvider.notifier).runWithVerification(
          () => _performJoin(competition),
        );
  }

  Future<void> _performJoin(CompetitionModel competition) async {
    final cost = _entries * competition.effectivePointsPerEntry;
    final prevPoints = _userPoints;
    final prevComp = competition;

    setState(() {
      _joining = true;
      _joinError = null;
      _optimistic = competition.copyWith(
        joined: true,
        myEntries: competition.myEntries + _entries,
        participantsCount: competition.participantsCount + _entries,
      );
    });
    ref.read(authProvider.notifier).updateUser({
      'points': (prevPoints - cost).clamp(0, 1 << 30),
    });

    try {
      final result = await ref.read(competitionsRepositoryProvider).join(
            competition.id,
            entries: _entries,
          );
      if (result.userPoints != null) {
        ref.read(authProvider.notifier).updateUser({'points': result.userPoints});
      }
      invalidateCompetitions(ref);
      ref.invalidate(competitionDetailProvider(widget.id));
      if (!mounted) return;
      setState(() {
        _optimistic = result.competition;
        _success = true;
        _joining = false;
      });
    } catch (e) {
      ref.read(authProvider.notifier).updateUser({'points': prevPoints});
      if (!mounted) return;
      final gate = ref.read(verificationGateProvider.notifier);
      if (gate.handleApiVerificationError(e, () => _performJoin(competition))) {
        setState(() {
          _optimistic = prevComp;
          _joining = false;
        });
        return;
      }
      setState(() {
        _optimistic = prevComp;
        _joining = false;
        _joinError = _errMsg(e);
      });
    }
  }

  String _errMsg(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
    }
    return 'تعذّر الانضمام';
  }

  ({int days, int hours, bool ended})? _remaining(DateTime? end) {
    if (end == null) return null;
    final diff = end.difference(DateTime.now());
    if (diff.isNegative) return (days: 0, hours: 0, ended: true);
    return (days: diff.inDays, hours: diff.inHours % 24, ended: false);
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(competitionDetailProvider(widget.id));

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: detailAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _errMsg(e),
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                TextButton(
                  onPressed: () =>
                      ref.invalidate(competitionDetailProvider(widget.id)),
                  child: const Text('إعادة المحاولة'),
                ),
              ],
            ),
          ),
          data: (loaded) {
            final competition = _optimistic?.id == loaded.id
                ? (_optimistic ?? loaded)
                : loaded;
            final remaining = _remaining(competition.endDate);
            final hasEnded =
                competition.ended || (remaining?.ended == true);
            final progressPct = (competition.progress * 100).round();
            final eligible = _userPoints >= competition.minPoints;
            final maxEntries =
                (_userPoints / competition.effectivePointsPerEntry)
                    .floor()
                    .clamp(0, 999999);
            final cost = _entries * competition.effectivePointsPerEntry;

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
              children: [
                TextButton.icon(
                  onPressed: () {
                    if (context.canPop()) {
                      context.pop();
                    } else {
                      context.go('/competitions');
                    }
                  },
                  icon: const Icon(LucideIcons.chevronRight, size: 20),
                  label: const Text(
                    'رجوع',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF6B7280),
                    alignment: Alignment.centerRight,
                  ),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(28),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: competition.image != null
                        ? AppImage(
                            src: competition.image,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            color: const Color(0xFFF3F4F6),
                            alignment: Alignment.center,
                            child:
                                const Text('🏆', style: TextStyle(fontSize: 56)),
                          ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  competition.title,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
                if (competition.description != null &&
                    competition.description!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    competition.description!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF4B5563),
                      height: 1.5,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    _meta(LucideIcons.coins, '${competition.minPoints}+ نقطة',
                        AppColors.primary),
                    _meta(LucideIcons.users,
                        '${competition.participantsCount} مشارك', null),
                    if (competition.location != null &&
                        competition.location!.isNotEmpty)
                      _meta(LucideIcons.mapPin, competition.location!, null),
                    if (remaining != null && !remaining.ended)
                      _meta(LucideIcons.clock,
                          '${remaining.days}ي ${remaining.hours}س', null),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(100),
                  child: LinearProgressIndicator(
                    value: competition.progress,
                    minHeight: 8,
                    backgroundColor: const Color(0xFFF3F4F6),
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$progressPct% من المشاركين المطلوبين',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF9CA3AF),
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 20),
                if (hasEnded)
                  _endedBox(competition)
                else if (_success)
                  _successBox()
                else
                  _joinPanel(
                    competition: competition,
                    eligible: eligible,
                    maxEntries: maxEntries,
                    cost: cost,
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _endedBox(CompetitionModel competition) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFCD34D), width: 2),
      ),
      child: Column(
        children: [
          const Text(
            '🎉 تم إعلان الفائز',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: Color(0xFF78350F),
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            competition.prizeName ?? competition.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF92400E),
              fontFamily: 'Cairo',
            ),
          ),
          if (competition.drawLink != null &&
              competition.drawLink!.isNotEmpty) ...[
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => launchUrl(
                Uri.parse(competition.drawLink!),
                mode: LaunchMode.externalApplication,
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'مشاهدة السحب',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _successBox() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.checkCircle2, color: Color(0xFF15803D)),
              SizedBox(width: 8),
              Text(
                'تمت إضافة المشاركات بنجاح!',
                style: TextStyle(
                  color: Color(0xFF15803D),
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => setState(() {
                _success = false;
                _entries = 1;
              }),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'إضافة مشاركات أخرى',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _joinPanel({
    required CompetitionModel competition,
    required bool eligible,
    required int maxEntries,
    required int cost,
  }) {
    final missing = (competition.minPoints - _userPoints).clamp(0, 1 << 30);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (competition.joined)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFDCFCE7)),
              ),
              child: Text(
                'لديك ${competition.myEntries} مشاركة — يمكنك شراء المزيد',
                style: const TextStyle(
                  color: Color(0xFF15803D),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          Text.rich(
            TextSpan(
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontWeight: FontWeight.bold,
                color: Color(0xFF4B5563),
              ),
              children: [
                const TextSpan(text: 'نقاطك: '),
                TextSpan(
                  text: '$_userPoints',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          if (!eligible) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(LucideIcons.alertTriangle,
                    size: 16, color: Color(0xFFD97706)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'تحتاج $missing نقطة إضافية',
                    style: const TextStyle(
                      color: Color(0xFFD97706),
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (eligible) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: Text(
                    competition.joined ? 'مشاركات إضافية' : 'عدد المشاركات',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      fontSize: 13,
                    ),
                  ),
                ),
                IconButton(
                  onPressed:
                      _entries > 1 ? () => setState(() => _entries--) : null,
                  icon: const Icon(LucideIcons.minus, size: 14),
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFFF3F4F6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                Text(
                  '$_entries',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    fontSize: 16,
                  ),
                ),
                IconButton(
                  onPressed: _entries < maxEntries
                      ? () => setState(() => _entries++)
                      : null,
                  icon: const Icon(LucideIcons.plus, size: 14),
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFFF3F4F6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
            Text(
              'التكلفة: $cost نقطة (${competition.effectivePointsPerEntry}/مشاركة)',
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF9CA3AF),
                fontFamily: 'Cairo',
                fontWeight: FontWeight.bold,
              ),
            ),
            if (_joinError != null) ...[
              const SizedBox(height: 8),
              Text(
                _joinError!,
                style: const TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  fontSize: 13,
                ),
              ),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: (_joining || _entries > maxEntries)
                    ? null
                    : () => _join(competition),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _joining
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.trophy, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            competition.joined
                                ? 'شراء مشاركات إضافية'
                                : 'انضم للمسابقة',
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _meta(IconData icon, String text, Color? color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color ?? const Color(0xFF6B7280)),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: color ?? const Color(0xFF6B7280),
            fontFamily: 'Cairo',
          ),
        ),
      ],
    );
  }
}
