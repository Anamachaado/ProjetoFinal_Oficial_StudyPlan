import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required

from .models import Aluno
from sistema.models import Curso, Serie, Disciplina
from sistema.preditivo import SistemaPreditivo


def cadastro(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        email = request.POST.get('email')
        senha = request.POST.get('senha')
        curso_id = request.POST.get('curso')
        serie_id = request.POST.get('serie')
        disciplinas_ids = request.POST.getlist('disciplinas')

        if Aluno.objects.filter(email=email).exists():
            return render(request, 'CadastroPerfil.html', {
                'erro': 'Este e-mail já está cadastrado.',
                'cursos': Curso.objects.all()
            })

        aluno = Aluno.objects.create_user(
            username=nome,
            email=email,
            password=senha
        )

        aluno.curso_id = curso_id
        aluno.save()

        disciplinas = Disciplina.objects.filter(
            id__in=disciplinas_ids
        )

        aluno.disciplinas_escolhidas.set(disciplinas)

        return redirect('login')

    return render(request, 'CadastroPerfil.html', {
        'cursos': Curso.objects.all()
    })


def filtrar_disciplinas(request):
    curso_id = request.GET.get('curso')
    ano = request.GET.get('serie')

    if not curso_id or not ano:
        return JsonResponse([], safe=False)

    try:
        serie = Serie.objects.get(
            curso_id=curso_id,
            ano=ano
        )
    except Serie.DoesNotExist:
        return JsonResponse([], safe=False)

    disciplinas = Disciplina.objects.filter(
        serie=serie,
        cursos__id=curso_id
    ).distinct()

    return JsonResponse([
        {
            'id': d.id,
            'nome': d.nome
        }
        for d in disciplinas
    ], safe=False)


def filtrar_formacao_geral(request):
    disciplinas = Disciplina.objects.filter(
        serie__isnull=True
    ).order_by('nome')

    return JsonResponse([
        {
            'id': d.id,
            'nome': d.nome
        }
        for d in disciplinas
    ], safe=False)


def login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        senha = request.POST.get('senha')

        usuario = authenticate(
            request,
            username=email,
            password=senha
        )

        if usuario is not None and usuario.is_active:
            auth_login(request, usuario)
            next_url = request.GET.get('next') or request.POST.get('next')
            if next_url:
                return redirect(next_url)
            return redirect('home')

        return render(request, 'LoginPerfil.html', {
            'erro': 'E-mail ou senha incorretos.'
        })

    return render(request, 'LoginPerfil.html')


@login_required
def home(request):
    from django.db.models import Sum
    from sistema.models import Atividade

    disciplinas = request.user.disciplinas_escolhidas.all().order_by('nome')
    tabela = []

    for disciplina in disciplinas:
        bims = []

        for bimestre in ['1', '2', '3', '4']:
            total_bimestre = Atividade.objects.filter(
                aluno=request.user,
                disciplina=disciplina,
                bimestre=bimestre
            ).aggregate(total=Sum('valor'))['total'] or 0

            bims.append(total_bimestre)

        total = sum(bims)
        falta = max(60 - total, 0)

        tabela.append({
            'id': disciplina.id,
            'nome': disciplina.nome,
            'bim1': bims[0],
            'bim2': bims[1],
            'bim3': bims[2],
            'bim4': bims[3],
            'total': total,
            'falta': falta,
        })

    return render(
        request,
        'PaginaHome.html',
        {'tabela': tabela}
    )


@login_required
def perfil(request):
    cursos = Curso.objects.all().order_by('nome')

    return render(
        request,
        'EdicaoPerfil.html',
        {
            'cursos': cursos
        }
    )

@login_required
def atualizar_perfil(request):

    if request.method != 'POST':
        return JsonResponse(
            {'erro': 'Método inválido.'},
            status=405
        )

    aluno = request.user

    nome = request.POST.get('nome', '').strip()
    email = request.POST.get('email', '').strip()
    curso_id = request.POST.get('curso')

    if not nome:
        return JsonResponse(
            {'erro': 'O nome não pode ficar vazio.'},
            status=400
        )

    if not email:
        return JsonResponse(
            {'erro': 'O e-mail não pode ficar vazio.'},
            status=400
        )

    outro_aluno = Aluno.objects.filter(
        email=email
    ).exclude(
        id=aluno.id
    ).first()

    if outro_aluno:
        return JsonResponse(
            {'erro': 'Este e-mail já está cadastrado.'},
            status=400
        )

    aluno.username = nome
    aluno.email = email

    if curso_id:
        try:
            curso = Curso.objects.get(id=curso_id)
            aluno.curso = curso
        except Curso.DoesNotExist:
            return JsonResponse(
                {'erro': 'Curso não encontrado.'},
                status=400
            )

    aluno.save()

    return JsonResponse({
        'ok': True,
        'nome': aluno.username,
        'email': aluno.email,
        'curso': aluno.curso.nome if aluno.curso else 'Não informado'
    })


@login_required
def tarefas(request):
    return render(request, 'PaginaTarefas.html')


@login_required
def duvidas(request):
    return render(request, 'Duvidas.html')


@login_required
def estatisticas(request):
    aluno_alvo = request.user
    todos_alunos = None

    # Se for coordenador/admin (staff ou superuser), pode visualizar qualquer aluno
    if request.user.is_staff or request.user.is_superuser:
        todos_alunos = Aluno.objects.all().order_by('username')
        aluno_id_param = request.GET.get('aluno_id')
        if aluno_id_param:
            aluno_selecionado = Aluno.objects.filter(id=aluno_id_param).first()
            if aluno_selecionado:
                aluno_alvo = aluno_selecionado

    # Buscar turma/série do aluno
    turma_nome = "2ª Série"
    if aluno_alvo.curso:
        serie = Serie.objects.filter(curso=aluno_alvo.curso).first()
        if serie:
            turma_nome = serie.get_ano_display()

    # Processamento Preditivo com Pandas
    disciplinas_data = SistemaPreditivo.obter_estatisticas_completas_aluno(aluno_alvo)
    painel_admin = SistemaPreditivo.obter_painel_admin() if (request.user.is_staff or request.user.is_superuser) else None

    # Encontrar a disciplina inicial (priorizar Matemática ou a primeira da lista)
    disciplina_inicial = None
    for d in disciplinas_data:
        if 'matem' in d['disciplina_nome'].lower():
            disciplina_inicial = d
            break
    if not disciplina_inicial and disciplinas_data:
        disciplina_inicial = disciplinas_data[0]

    contexto = {
        'aluno_analisado': aluno_alvo,
        'turma_nome': turma_nome,
        'disciplinas_data': disciplinas_data,
        'disciplinas_json': json.dumps(disciplinas_data),
        'disciplina_selecionada': disciplina_inicial,
        'todos_alunos': todos_alunos,
        'painel_admin': painel_admin,
        'is_admin': request.user.is_staff or request.user.is_superuser,
    }
    return render(request, 'PaginaEstatistica.html', contexto)


@login_required
def api_dados_estatisticas(request):
    """
    API JSON que retorna os dados analíticos e preditivos calculados com Pandas
    para que o JavaScript construa os gráficos dinamicamente.
    """
    aluno_alvo = request.user
    if (request.user.is_staff or request.user.is_superuser) and request.GET.get('aluno_id'):
        aluno_alvo = Aluno.objects.filter(id=request.GET.get('aluno_id')).first() or request.user

    disciplina_id = request.GET.get('disciplina_id')
    disciplinas_data = SistemaPreditivo.obter_estatisticas_completas_aluno(aluno_alvo)

    if disciplina_id:
        for d in disciplinas_data:
            if str(d['disciplina_id']) == str(disciplina_id):
                return JsonResponse(d)

    return JsonResponse({'disciplinas': disciplinas_data})


@login_required
def manual(request):
    return render(request, 'Manual.html')


@login_required
def criar_atividade(request):
    from django.db.models import Sum
    from sistema.models import Atividade

    if request.method != 'POST':
        return JsonResponse(
            {'erro': 'Método inválido.'},
            status=405
        )

    disciplina_id = request.POST.get('disciplina')
    nome = request.POST.get('nome', '').strip()
    valor = request.POST.get('valor')
    bimestre = request.POST.get('bimestre')

    if not disciplina_id or not nome or not valor or not bimestre:
        return JsonResponse(
            {'erro': 'Preencha todos os campos.'},
            status=400
        )

    if bimestre not in ['1', '2', '3', '4']:
        return JsonResponse(
            {'erro': 'Bimestre inválido.'},
            status=400
        )

    try:
        valor = float(valor)
    except ValueError:
        return JsonResponse(
            {'erro': 'O valor precisa ser um número.'},
            status=400
        )

    if valor < 0:
        return JsonResponse(
            {'erro': 'O valor não pode ser negativo.'},
            status=400
        )

    try:
        disciplina = request.user.disciplinas_escolhidas.get(
            id=disciplina_id
        )
    except Exception:
        return JsonResponse(
            {'erro': 'Disciplina não encontrada.'},
            status=404
        )

    Atividade.objects.create(
        aluno=request.user,
        disciplina=disciplina,
        nome=nome,
        valor=valor,
        bimestre=bimestre
    )

    atividades = Atividade.objects.filter(
        aluno=request.user,
        disciplina=disciplina,
        bimestre=bimestre
    ).order_by('id')

    return JsonResponse({
        'ok': True,
        'atividades': [
            {
                'id': a.id,
                'nome': a.nome,
                'valor': a.valor
            }
            for a in atividades
        ],
        'total_bimestre': atividades.aggregate(
            total=Sum('valor')
        )['total'] or 0
    })


@login_required
def listar_atividades(request):
    from django.db.models import Sum
    from sistema.models import Atividade

    disciplina_id = request.GET.get('disciplina')
    bimestre = request.GET.get('bimestre')

    if not disciplina_id or bimestre not in ['1', '2', '3', '4']:
        return JsonResponse(
            {'erro': 'Dados inválidos.'},
            status=400
        )

    try:
        disciplina = request.user.disciplinas_escolhidas.get(
            id=disciplina_id
        )
    except Exception:
        return JsonResponse(
            {'erro': 'Disciplina não encontrada.'},
            status=404
        )

    atividades = Atividade.objects.filter(
        aluno=request.user,
        disciplina=disciplina,
        bimestre=bimestre
    ).order_by('id')

    return JsonResponse({
        'atividades': [
            {
                'id': a.id,
                'nome': a.nome,
                'valor': a.valor
            }
            for a in atividades
        ],
        'total_bimestre': atividades.aggregate(
            total=Sum('valor')
        )['total'] or 0
    })