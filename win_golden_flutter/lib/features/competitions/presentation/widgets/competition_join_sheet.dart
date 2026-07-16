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
      (_userPoints / _competition.effectivePointsPerEntry).floor().clamp(0, 999999).toInt();

  int get _cost => _entries * _competition.effectivePointsPerEntry;

  bool get _eligible => _userPoints >= _competition.minPoints;

  String _formatTimeLeft(DateTime? end) {
    if (end == null) return 'قريباً';
    final diff = end.difference(DateTime.now());
    if (diff.isNegative) return 'منتهية';
    if (diff.inDays > 0) return '${diff.inDays} يوم';
    return '${diff.inHours} ساعة';
  }

  Future<void> _join() async {
    if (_joining || !_eligible || _entries < 1 || _entries > _maxEntries) return;
    ref.read(verificationGateProvider.notifier).runWithVerification(_performJoin);
  }

  Future<void> _performJoin() async {
    final prevPoints = _userPoints;
    setState(() {
      _joining = true;
      _error = null;
    });
    
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
                      color: AppColors.primary,
                      child: _competition.image != null
                          ? AppImage(src: _competition.image, fit: BoxFit.cover)
                          : const Center(child: Text('🏆', style: TextStyle(fontSize: 56))),
                    ),
                    Positioned(
                      top: 12,
                      left: 12,
                      child: IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(LucideIcons.x, color: Colors.white),
                        style: IconButton.styleFrom(backgroundColor: Colors.black26),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_competition.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: [
                      _chip(LucideIcons.coins, '${_competition.minPoints} نقطة'),
                      _chip(LucideIcons.clock, _formatTimeLeft(_competition.endDate)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  if (_success) _successBox() else _joinForm(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _joinForm() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('عدد المشاركات', style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
            Row(
              children: [
                IconButton(onPressed: _entries > 1 ? () => setState(() => _entries--) : null, icon: const Icon(LucideIcons.minus)),
                Text('$_entries', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(onPressed: _entries < _maxEntries ? () => setState(() => _entries++) : null, icon: const Icon(LucideIcons.plus)),
              ],
            ),
          ],
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _eligible && !_joining ? _join : null,
            child: _joining ? const CircularProgressIndicator() : const Text('انضم الآن', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ),
      ],
    );
  }

  Widget _successBox() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(16)),
      child: const Text('تم الانضمام بنجاح!', textAlign: TextAlign.center, style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
    );
  }

  Widget _chip(IconData icon, String label) {
    return Chip(label: Text(label, style: const TextStyle(fontSize: 11)), avatar: Icon(icon, size: 14));
  }
}
