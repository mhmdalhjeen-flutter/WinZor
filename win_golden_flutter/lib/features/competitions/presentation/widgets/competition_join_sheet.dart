import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_image.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../data/models/competition_model.dart';
import '../providers/competitions_providers.dart';

/// Shared join / buy-entries UI (React CompetitionModal + home join modal semantics).
Future<CompetitionModel?> showCompetitionJoinSheet({
  required BuildContext context,
  required WidgetRef ref,
  required CompetitionModel competition,
}) {
  final isAuth = ref.read(authProvider).isAuth;
  if (!isAuth) {
    context.push('/login');
    return Future.value(null);
  }

  return showModalBottomSheet<CompetitionModel>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => CompetitionJoinSheet(initial: competition),
  );
}

class CompetitionJoinSheet extends ConsumerStatefulWidget {
  final CompetitionModel initial;

  const CompetitionJoinSheet({super.key, required this.initial});

  @override
  ConsumerState<CompetitionJoinSheet> createState() =>
      _CompetitionJoinSheetState();
}

class _CompetitionJoinSheetState extends ConsumerState<CompetitionJoinSheet> {
  late CompetitionModel _competition;
  int _entries = 1;
  bool _joining = false;
  bool _success = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _competition = widget.initial;
  }

  int get _userPoints =>
      (ref.watch(authProvider).user?['points'] as num?)?.toInt() ?? 0;

  int get _maxEntries =>
      (_userPoints / _competition.effectivePointsPerEntry).floor().clamp(0, 999999);

  int get _cost => _entries * _competition.effectivePointsPerEntry;

  bool get _eligible => _userPoints >= _competition.minPoints;

  Future<void> _join() async {
    if (_joining || !_eligible || _entries < 1 || _entries > _maxEntries) return;
    ref.read(verificationGateProvider.notifier).runWithVerification(_performJoin);
  }

  Future<void> _performJoin() async {
    if (_joining || !_eligible || _entries < 1 || _entries > _maxEntries) return;

    final prevPoints = _userPoints;
    setState(() {
      _joining = true;
      _error = null;
    });
    // Optimistic points (mirrors React).
    ref.read(authProvider.notifier).updateUser({
      'points': (prevPoints - _cost).clamp(0, 1 << 30),
    });

    try {
      final result = await ref.read(competitionsRepositoryProvider).join(
            _competition.id,
            entries: _entries,
          );
      if (result.userPoints != null) {
        ref.read(authProvider.notifier).updateUser({'points': result.userPoints});
      }
      invalidateCompetitions(ref);
      ref.invalidate(competitionDetailProvider(_competition.id));
      if (!mounted) return;
      setState(() {
        _competition = result.competition;
        _success = true;
        _joining = false;
      });
    } catch (e) {
      ref.read(authProvider.notifier).updateUser({'points': prevPoints});
      if (!mounted) return;
      final gate = ref.read(verificationGateProvider.notifier);
      if (gate.handleApiVerificationError(e, _performJoin)) {
        setState(() => _joining = false);
        return;
      }
      setState(() {
        _joining = false;
        _error = _errMsg(e);
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

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: EdgeInsets.only(bottom: bottom),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              child: AspectRatio(
                aspectRatio: 16 / 10,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF9333EA), Color(0xFF3730A3)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: _competition.image != null
                          ? ColorFiltered(
                              colorFilter: ColorFilter.mode(
                                Colors.black.withOpacity(0.25),
                                BlendMode.darken,
                              ),
                              child: AppImage(
                                src: _competition.image,
                                fit: BoxFit.cover,
                              ),
                            )
                          : const Center(
                              child: Text('🏆', style: TextStyle(fontSize: 56)),
                            ),
                    ),
                    Positioned(
                      top: 12,
                      left: 12,
                      child: IconButton(
                        onPressed: () => Navigator.pop(context, _competition),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black38,
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(LucideIcons.x, size: 20),
                      ),
                    ),
                    if (_competition.joined)
                      Positioned(
                        top: 16,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF22C55E),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.checkCircle2,
                                  size: 14, color: Colors.white),
                              SizedBox(width: 4),
                              Text(
                                'تم الانضمام',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Cairo',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _competition.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  if (_competition.description != null &&
                      _competition.description!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      _competition.description!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF4B5563),
                        height: 1.5,
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _chip(LucideIcons.coins, '${_competition.minPoints}+ نقطة'),
                      _chip(LucideIcons.users, '${_competition.participantsCount}'),
                      _chip(
                        LucideIcons.clock,
                        competitionTimeLeft(_competition.endDate),
                      ),
                      if (_competition.location != null &&
                          _competition.location!.isNotEmpty)
                        _chip(LucideIcons.mapPin, _competition.location!),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_success)
                    _successBox()
                  else if (_competition.ended)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: const Text(
                        'انتهت هذه المسابقة',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF92400E),
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    )
                  else
                    _joinForm(),
                ],
              ),
            ),
          ],
        ),
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
          Text(
            'تمت إضافة $_entries مشاركة بنجاح!',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF15803D),
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
            ),
          ),
          TextButton(
            onPressed: () => setState(() {
              _success = false;
              _entries = 1;
            }),
            child: const Text(
              'إضافة مشاركات أخرى',
              style: TextStyle(
                color: Color(0xFF166534),
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
                decoration: TextDecoration.underline,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, _competition),
            child: const Text(
              'إغلاق',
              style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _joinForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_competition.joined)
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
              'أنت مشارك — لديك ${_competition.myEntries} مشاركة. يمكنك شراء المزيد.',
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
            style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
            children: [
              const TextSpan(text: 'نقاطك: '),
              TextSpan(
                text: '$_userPoints',
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900),
              ),
            ],
          ),
        ),
        if (!_eligible)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'تحتاج ${_competition.minPoints} نقطة على الأقل',
              style: const TextStyle(
                color: Color(0xFFD97706),
                fontSize: 12,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        if (_eligible) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    _competition.joined ? 'مشاركات إضافية' : 'عدد المشاركات',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      fontSize: 13,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _entries > 1
                      ? () => setState(() => _entries--)
                      : null,
                  icon: const Icon(LucideIcons.minus, size: 16),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                ),
                SizedBox(
                  width: 28,
                  child: Text(
                    '$_entries',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      fontSize: 16,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _entries < _maxEntries
                      ? () => setState(() => _entries++)
                      : null,
                  icon: const Icon(LucideIcons.plus, size: 16),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'التكلفة: $_cost نقطة',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF9CA3AF),
              fontFamily: 'Cairo',
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _error!,
              style: const TextStyle(
                color: Colors.red,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: _eligible && !_joining
                  ? const LinearGradient(
                      colors: [Color(0xFF9333EA), Color(0xFF4F46E5)],
                    )
                  : null,
              color: (!_eligible || _joining) ? Colors.grey.shade300 : null,
            ),
            child: ElevatedButton(
              onPressed: _eligible && !_joining ? _join : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                disabledBackgroundColor: Colors.transparent,
                foregroundColor: Colors.white,
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
                        const Icon(LucideIcons.trophy, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          _competition.joined
                              ? 'شراء مشاركات إضافية'
                              : 'انضم الآن',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _chip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF6B7280)),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Color(0xFF6B7280),
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}
