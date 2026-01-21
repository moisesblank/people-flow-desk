// ============================================
// DIRECT BULK IMPORT - OWNER ONLY
// Importação direta sem necessidade de UI
// ============================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate CPF format locally
function validateCPFFormat(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 11) return false;
  const padded = cleaned.padStart(11, '0');
  if (/^(\d)\1+$/.test(padded)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(padded.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(padded.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(padded.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(padded.charAt(10))) return false;
  
  return true;
}

function normalizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '').padStart(11, '0');
}

// TODOS OS ALUNOS DO EXCEL
const STUDENTS_DATA = [
  {"nome":"Arielly Gomes","email":"gomesarielly52@gmail.com","telefone":"83981236393","cpf":"70701381485","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Kayo Maia Duarte","email":"bielmaiad@gmail.com","telefone":"83981769821","cpf":"11216118426","cidade":"Queimadas","estado":"PB"},
  {"nome":"Jose Eduardo Gomes Wilkens","email":"joseeduardowilkens@gmail.com","telefone":"92994912720","cpf":"07210410279","cidade":"Manaus","estado":"AM"},
  {"nome":"Maria Clara Clementino Lopes","email":"claritalopes001@gmail.com","telefone":"83987485614","cpf":"71169919480","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Arthur Henriques","email":"arthurhenriquessavieira4@gmail.com","telefone":"83988676890","cpf":"14474121414","cidade":"Campina Grande","estado":"PB"},
  {"nome":"Heloisa Silva Andrade","email":"heloisa_andrade1@icloud.com","telefone":"83996673411","cpf":"10621714461","cidade":"Itaporanga","estado":"PB"},
  {"nome":"yasmin victoria","email":"victoriayasmin0102@gmail.com","telefone":"81995571779","cpf":"08017343477","cidade":"Olinda","estado":"PE"},
  {"nome":"LETÍCIA CARTAXO DORE","email":"leticiacartaxodore@gmail.com","telefone":"83986349988","cpf":"71124242406","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Scarlet Victoria prado lima","email":"scarletvic5@gmail.com","telefone":"79998521101","cpf":"08971179562","cidade":"Nossa Senhora da Glória","estado":"SE"},
  {"nome":"Mariana De Araújo campos","email":"mariana.araujo290522@gmail.com","telefone":"83987530895","cpf":"70002654423","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Raquel Oliveira","email":"rraqueloliveirasz@gmail.com","telefone":"83982280905","cpf":"10995937435","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Evelyn Alves","email":"evestudy05@gmail.com","telefone":"21984941551","cpf":"17323905761","cidade":"Rio de Janeiro","estado":"RJ"},
  {"nome":"Maria esther da Costa Albuquerque oliveira","email":"maaria.esther13@gmail.com","telefone":"83986077027","cpf":"11233811436","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Vinicius Richarlyson","email":"viniciusricharlyson29@gmail.com","telefone":"45999251232","cpf":"10294374400","cidade":"Patos","estado":"PB"},
  {"nome":"Ana Luiza Marinho","email":"marinhoanaluiza093@gmail.com","telefone":"83996052122","cpf":"13189121486","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Filipe Freire Monteiro","email":"filipefreire2009@gmail.com","telefone":"83991616045","cpf":"12043527479","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Maria Fernanda Gomes Silva","email":"sousagomesfernanda@icloud.com","telefone":"83999924386","cpf":"17630715455","cidade":"Condado","estado":"PB"},
  {"nome":"Gabriel Belmino Moreira Lima","email":"gabrielbelmino5@gmail.com","telefone":"83993357000","cpf":"71696736498","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Rakelly Santos","email":"santosrakelly387@gmail.com","telefone":"83998298407","cpf":"10514323400","cidade":"Araruna","estado":"PB"},
  {"nome":"Maria Eduarda da Silva","email":"mariaaeduarda121205@gmail.com","telefone":"83988692382","cpf":"10302587403","cidade":"Santa Cecília","estado":"PB"},
  {"nome":"Eduardo Leandro Lins Oliveira","email":"edulins09@gmail.com","telefone":"83999863723","cpf":"10408798459","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Norma Cecília Ramalho Arnaud","email":"normaceciliaramalhoar@hotmail.com","telefone":"83996122805","cpf":"11424071445","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Evelyn Dias","email":"diasevelynluisa@gmail.com","telefone":"55999374727","cpf":"12532768622","cidade":"Santo Antônio do Monte","estado":"MG"},
  {"nome":"Luana Luna","email":"luanalunacr@gmail.com","telefone":"83986425395","cpf":"70880920424","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Mickennya Nascimento","email":"mickennyajarscyelly06@gmail.com","telefone":"84992167118","cpf":"12496712480","cidade":"Foz do Iguaçu","estado":"PR"},
  {"nome":"Emily Fernandes","email":"emilyfernandes410@gmail.com","telefone":"84991094065","cpf":"71104928426","cidade":"Natal","estado":"RN"},
  {"nome":"Nayelle Sthefany","email":"nayellesthefany35@gmail.com","telefone":"81999124658","cpf":"16700746418","cidade":"Feira Nova","estado":"PE"},
  {"nome":"João Pedro Pinheiro Barros Souza","email":"jp.pbs2006@gmail.com","telefone":"63984563231","cpf":"07855847146","cidade":"Palmas","estado":"TO"},
  {"nome":"Mariana de Freitas Alves","email":"marianaalvesfr08@gmail.com","telefone":"83998213707","cpf":"17612664461","cidade":"Brejo dos Santos","estado":"PB"},
  {"nome":"Hillary Batista Lima","email":"mart.bat26@gmail.com","telefone":"92986163624","cpf":"70082631204","cidade":"Manaus","estado":"AM"},
  {"nome":"Matheus Amaral","email":"matheus12407@gmail.com","telefone":"84999849564","cpf":"01753656443","cidade":"Natal","estado":"RN"},
  {"nome":"Ágatha Alcântara","email":"agathaalcantaraofc@gmail.com","telefone":"83986727401","cpf":"10320339408","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Danúbia Helena de Souza Araújo","email":"danubiahelena01@gmail.com","telefone":"83993882166","cpf":"09040898510","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Yonara Gomes","email":"yonara.paiva1@gmail.com","telefone":"84999015217","cpf":"12596282488","cidade":"Martins","estado":"RN"},
  {"nome":"Ana Daniele Melo","email":"danifariasmelo@gmail.com","telefone":"86999222989","cpf":"04554608336","cidade":"Parnaíba","estado":"PI"},
  {"nome":"SABRINA CARVALHO DE OLIVEIRA","email":"sabrinacarvalhocap@gmail.com","telefone":"33997007500","cpf":"16475077666","cidade":"Capelinha","estado":"MG"},
  {"nome":"Letícia Temoteo felizardo","email":"leticiatemoteofelizardo@gmail.com","telefone":"88981997931","cpf":"12751398413","cidade":"Jardim","estado":"CE"},
  {"nome":"Emylee maria Dias","email":"emyleemaria06@gmail.com","telefone":"32999176301","cpf":"14499536626","cidade":"Barbacena","estado":"MG"},
  {"nome":"Laura Beatriz Sarmento Cruz","email":"llaurabeatrizsc@gmail.com","telefone":"84998655187","cpf":"13459019417","cidade":"Parnamirim","estado":"RN"},
  {"nome":"Ines Barros lima","email":"inesbarros2911@gmail.com","telefone":"85996302261","cpf":"61138828378","cidade":"Beberibe","estado":"CE"},
  {"nome":"Julia Nascimento","email":"julinha1234nascimento@gmail.com","telefone":"83986847006","cpf":"71884074448","cidade":"João Pessoa","estado":"PB"},
  {"nome":"sara leite","email":"sarabarbosa0606morais@gmail.com","telefone":"83991144582","cpf":"10919571425","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Paloma Rios Queiroz Brito","email":"paloma.rios.queiroz@outlook.com","telefone":"75981715285","cpf":"06264993565","cidade":"Feira de Santana","estado":"BA"},
  {"nome":"Elton Silva","email":"eltonwalker909@gmail.com","telefone":"11946402537","cpf":"36590291810","cidade":"São Paulo","estado":"SP"},
  {"nome":"PEDRO ARTHUR DIAS DA SILVA","email":"pedroarthur081006@gmail.com","telefone":"83999424788","cpf":"14362174400","cidade":"Boa Ventura","estado":"PB"},
  {"nome":"Ana Clara Bezerra Modesto","email":"anaclarabmodesto10@gmail.com","telefone":"79996496313","cpf":"07227245519","cidade":"Aracaju","estado":"SE"},
  {"nome":"Sarah Alves Barreiro","email":"sarahbidobarreiro@gmail.com","telefone":"83988435034","cpf":"10270615407","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Laura Maria Alves da Silva","email":"lauramariasilva83@gmail.com","telefone":"83991948311","cpf":"14360495471","cidade":"Rio de Janeiro","estado":"RJ"},
  {"nome":"Luan José Pereira Monteiro","email":"luanmon993@gmail.com","telefone":"83986311835","cpf":"14827202486","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Ana Júlia de Queiroz Leal","email":"anjulaine778@gmail.com","telefone":"83999211165","cpf":"12115087496","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Jhad Mustaf Said","email":"saidmustaf123@gmail.com","telefone":"84999247744","cpf":"01646679466","cidade":"Natal","estado":"RN"},
  {"nome":"Arthur Rian de Araújo Azevedo","email":"arthurraraujoa@outlook.com","telefone":"84992287036","cpf":"71823482414","cidade":"São Paulo do Potengi","estado":"RN"},
  {"nome":"PEDRO LUCA DANTAS ESTEVAM DE MEDEIROS","email":"pedro.luca@academico.ifpb.edu.br","telefone":"84994500742","cpf":"12776862466","cidade":"Centro","estado":"RN"},
  {"nome":"Laura Carmelita Brandão","email":"laura.carmelitab@gmail.com","telefone":"81993300004","cpf":"15879164446","cidade":"Recife","estado":"PE"},
  {"nome":"Ana Clara da Silva","email":"anac252882@gmail.com","telefone":"84999705072","cpf":"13518467441","cidade":"Portalegre","estado":"RN"},
  {"nome":"Saulo Régis Rocha Monteiro","email":"sauloregisoutro11@gmail.com","telefone":"85996715093","cpf":"09745517321","cidade":"Beberibe","estado":"CE"},
  {"nome":"Maria Luísa Araújo Lúcio","email":"luisa2709maria@gmail.com","telefone":"83991373576","cpf":"10691831483","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Maria Fernanda Campos","email":"mariaftcampos@gmail.com","telefone":"83998179831","cpf":"01826555471","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Noemi Apolinário","email":"noemiapolinario251@gmail.com","telefone":"84999667676","cpf":"70848442440","cidade":"Natal","estado":"RN"},
  {"nome":"Hildeana Samya Diniz Araújo","email":"hildeana.diniz@gmail.com","telefone":"83996091795","cpf":"13559522471","cidade":"Catolé do Rocha","estado":"PB"},
  {"nome":"Maria Vitória dos Santos Silva","email":"vitoriaestudos14@gmail.com","telefone":"88981207655","cpf":"09815073362","cidade":"Quixeré","estado":"CE"},
  {"nome":"Italo Victor Nicolau Barbosa","email":"italomed165@gmail.com","telefone":"83996488408","cpf":"17545095413","cidade":"Rua travessa Eliziário costa","estado":"PB"},
  {"nome":"Rafael Tinoco de Lira","email":"rtlira08@gmail.com","telefone":"83991283528","cpf":"09971546400","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Luciana leite","email":"studyseves@gmail.com","telefone":"74999355520","cpf":"11940663563","cidade":"Remanso","estado":"BA"},
  {"nome":"Sabrinna Beatriz de Brito","email":"sabrinnabeatriz@gmail.com","telefone":"83986199626","cpf":"71555483402","cidade":"Campina Grande","estado":"PB"},
  {"nome":"Milene Morato","email":"milenemoratoufpb@gmail.com","telefone":"17996438102","cpf":"15946346458","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Caline Leite Silva","email":"leitecaline96@gmail.com","telefone":"74999713025","cpf":"11969530588","cidade":"Remanso","estado":"BA"},
  {"nome":"Pedro Machado","email":"pedrommachado.opo@gmail.com","telefone":"69992779092","cpf":"00617755256","cidade":"Ji-Paraná","estado":"RO"},
  {"nome":"Fred Fernandes","email":"fredfernandes11@gmail.com","telefone":"77981010538","cpf":"09575562500","cidade":"Matina","estado":"BA"},
  {"nome":"Beatriz Sarmento","email":"beatrizsarmento2304@gmail.com","telefone":"83996049216","cpf":"71006553401","cidade":"Pombal","estado":"PB"},
  {"nome":"Giovana Carli Macedo da Fonseca Melo","email":"gicarli0101@gmail.com","telefone":"84994941404","cpf":"70137801467","cidade":"Parnamirim","estado":"RN"},
  {"nome":"VINCENZO TOMMASO BRITO SODRE","email":"vincenzosodre@gmail.com","telefone":"91985872337","cpf":"06206402274","cidade":"Nova Timboteua","estado":"PA"},
  {"nome":"Fernanda Nery Davi de Oliveira","email":"fernandanerydavideoliveira@gmail.com","telefone":"83998917700","cpf":"09286725493","cidade":"Patos","estado":"PB"},
  {"nome":"Letícia Vicente Pinto Barbosa","email":"leticiabarbos53@gmail.com","telefone":"83999421718","cpf":"10190687444","cidade":"Campina Grande","estado":"PB"},
  {"nome":"Sofia Patriota Lima Magalhães","email":"sofiapatriota100@gmail.com","telefone":"84986200101","cpf":"11852651474","cidade":"Natal","estado":"RN"},
  {"nome":"Vinícius de Sena Leal Anacleto","email":"vinicius.senala@gmail.com","telefone":"83991835877","cpf":"13162123437","cidade":"Lagoa Seca","estado":"PB"},
  {"nome":"Ingrid Thays Nunes Fontes","email":"ingridfontes22@gmail.com","telefone":"84981056651","cpf":"70171618408","cidade":"Mossoró","estado":"RN"},
  {"nome":"Maria Luíza Andrade Cabral de Melo","email":"mariialluiizaaa@gmail.com","telefone":"37998222334","cpf":"14448347621","cidade":"Santo Antônio do Monte","estado":"MG"},
  {"nome":"Charles Filho","email":"charlesgfafc@gmail.com","telefone":"84987988166","cpf":"10965615499","cidade":"Tibau do Sul","estado":"RN"},
  {"nome":"Antonio Samuel da Silva Castro","email":"samuelsiova31@gmail.com","telefone":"85989606964","cpf":"09237766300","cidade":"Caucaia","estado":"CE"},
  {"nome":"Sabrina da Silva França","email":"sabrinasilvassf30@gmail.com","telefone":"83996049581","cpf":"14766055489","cidade":"Pombal","estado":"PB"},
  {"nome":"Ana Thereza Marques Batista","email":"therezamrqs08@gmail.com","telefone":"84998023076","cpf":"70633632473","cidade":"Cuité","estado":"PB"},
  {"nome":"Anny Carolinny Henrique de Queiroz","email":"acarolhq@gmail.com","telefone":"84981600817","cpf":"08549032409","cidade":"Pau dos Ferros","estado":"RN"},
  {"nome":"Maria Letícia Ticyanne de Souza","email":"lleticiaticyanne@gmail.com","telefone":"84988497405","cpf":"12915000492","cidade":"Mossoró","estado":"RN"},
  {"nome":"José Filipe nascimento","email":"filipenascimartins@gmail.com","telefone":"83996324499","cpf":"12302914406","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Eduardo de Araújo Nascimento","email":"eduardonea@hotmail.com","telefone":"83993153812","cpf":"06791829427","cidade":"Lagoa Seca","estado":"PB"},
  {"nome":"Sarah Lívia Gomes Roque","email":"sarahlgroque@gmail.com","telefone":"83987687463","cpf":"10969451423","cidade":"Santa Rita","estado":"PB"},
  {"nome":"Luana Lira","email":"luanavlira@icloud.com","telefone":"81997621825","cpf":"70291613438","cidade":"Recife","estado":"PE"},
  {"nome":"JORGE LEONARDO BARACUHY GUIMARAES","email":"jorgebaracuhy@gmail.com","telefone":"83987865646","cpf":"10479184470","cidade":"Torre","estado":"PB"},
  {"nome":"Guilherme Freitas","email":"guilhermefreitaspb10@gmail.com","telefone":"83996283025","cpf":"10320663426","cidade":"Coremas","estado":"PB"},
  {"nome":"Luana Cristine Ferreira da Silva","email":"luanacristine209@gmail.com","telefone":"81986524055","cpf":"11919287485","cidade":"Recife","estado":"PE"},
  {"nome":"Márcio Alcântara","email":"marciohenrique2205@gmail.com","telefone":"83987652821","cpf":"71442799471","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Karine Crislayne Fidelis de Araújo","email":"karinecrislayne1@gmail.com","telefone":"82999024814","cpf":"13488321428","cidade":"Colônia Leopoldina","estado":"AL"},
  {"nome":"Larissa Michele do Nascimento Firmino","email":"larissamichelenf@gmail.com","telefone":"83996125441","cpf":"13148827406","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Deborah Mendonça Chacon","email":"chacondeborah@yahoo.com","telefone":"84987189546","cpf":"70825080428","cidade":"Natal","estado":"RN"},
  {"nome":"Carol Tintino","email":"albuquerquec316@gmail.com","telefone":"81998797330","cpf":"14786388424","cidade":"Cachoeirinha","estado":"PE"},
  {"nome":"Giovanna Mello","email":"giovannamellomoura@hotmail.com","telefone":"11997677715","cpf":"51549612859","cidade":"São Paulo","estado":"SP"},
  {"nome":"Dorothy Moura Formiga","email":"dorothymouraformig@gmail.com","telefone":"83999437700","cpf":"11068093439","cidade":"Pombal","estado":"PB"},
  {"nome":"Maria Thereza Marinho Bandeira","email":"mariatherezamarinhobandeira@gmail.com","telefone":"83996158871","cpf":"10067937470","cidade":"Pombal","estado":"PB"},
  {"nome":"Maria Fernanda Guastella","email":"mariaguastellaa@gmail.com","telefone":"84991961906","cpf":"13021685412","cidade":"Mossoró","estado":"RN"},
  {"nome":"Walter Martins Dantas Neto","email":"walterdantasneto@gmail.com","telefone":"85994035318","cpf":"06116458238","cidade":"Inhangapi","estado":"PA"},
  {"nome":"Gabriel Victor Neri de Abreu","email":"gabrielvictornerideabreu@gmail.com","telefone":"35999605904","cpf":"02246675642","cidade":"Lavras","estado":"MG"},
  {"nome":"Júlia Vitória Ferreira Abílio","email":"julinhaabilio29@gmail.com","telefone":"83998214963","cpf":"11040269451","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Laura Araujo Luz Guimaraes","email":"itslauraguimaraes@gmail.com","telefone":"89994172904","cpf":"08203460399","cidade":"Itainópolis","estado":"PI"},
  {"nome":"João Lucas Pinto de Menezes Fernandes","email":"jlpmfernandes@gmail.com","telefone":"83987658308","cpf":"15519535442","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Loíse Carla de souza frança","email":"carlaloise81@gmail.com","telefone":"84996308074","cpf":"14362140417","cidade":"Jucurutu","estado":"RN"},
  {"nome":"Nicoli Siqueira Coutinho da Silva","email":"siqueira.nicoli19@gmail.com","telefone":"84999179643","cpf":"12539284442","cidade":"Macau","estado":"RN"},
  {"nome":"wallyson jailson da fonseca","email":"wallysonjailson1999_@outlook.com","telefone":"81982274482","cpf":"70746103484","cidade":"centro","estado":"PE"},
  {"nome":"Marina Souto Gomes Protasio de Lima","email":"marinasouto71@gmail.com","telefone":"84981474304","cpf":"14334738443","cidade":"Parnamirim","estado":"RN"},
  {"nome":"Ana Kalliny Jacome Silva","email":"anakallinyja10@gmail.com","telefone":"84998307271","cpf":"70653675410","cidade":"Tenente Ananias","estado":"RN"},
  {"nome":"Jennifer Nares","email":"jennifernaressouza@gmail.com","telefone":"83986896757","cpf":"14633091476","cidade":"Santa Rita","estado":"PB"},
  {"nome":"Yasmim Gabrieli","email":"yasmimgabrieli09@gmail.com","telefone":"81989025247","cpf":"15521232435","cidade":"Paulista","estado":"PE"},
  {"nome":"Hamilton de Sousa Araújo","email":"sgthamilton26@hotmail.com","telefone":"84999826917","cpf":"64142388304","cidade":"Parnamirim","estado":"RN"},
  {"nome":"Anália Karla Rodrigues Machado","email":"analiakarlaa@gmail.com","telefone":"83982298545","cpf":"71905179448","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Veluma De Sousa Guedes","email":"velumasousag@gmail.com","telefone":"83991232148","cpf":"17213133462","cidade":"Cajazeiras","estado":"PB"},
  {"nome":"Maria Luíza Benjamim","email":"marialuizabenjamin311@gmail.com","telefone":"87981306023","cpf":"09258781465","cidade":"Sobradinho","estado":"BA"},
  {"nome":"Leticia Bispo","email":"leticiabispo33@gmail.com","telefone":"84998423860","cpf":"12809193452","cidade":"Parnamirim","estado":"RN"},
  {"nome":"Laisy Araujo","email":"araujolaisy27@gmail.com","telefone":"87988349643","cpf":"06921821447","cidade":"Petrolina","estado":"PE"},
  {"nome":"Sabrina Bezerra","email":"sasamedicinafederal2023@gmail.com","telefone":"81997114990","cpf":"07538605460","cidade":"Camocim de São Félix","estado":"PE"},
  {"nome":"Sarah Hellen","email":"sarahellenformiga@gmail.com","telefone":"83981859984","cpf":"16604558479","cidade":"Sousa","estado":"PB"},
  {"nome":"Camila Maria","email":"camilamaria0641@gmail.com","telefone":"83986956621","cpf":"07664743486","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Gabriela Batista Neves","email":"batistaneves017@gmail.com","telefone":"75991736244","cpf":"10332884546","cidade":"Alagoinhas","estado":"BA"},
  {"nome":"José Guilherme Costa Gonçalves","email":"guilhermecostag8919@gmail.com","telefone":"85998272111","cpf":"05107493300","cidade":"Fortaleza","estado":"CE"},
  {"nome":"Samara Araújo","email":"samaradnap@gmail.com","telefone":"87998072824","cpf":"08512908416","cidade":"Salgueiro","estado":"PE"},
  {"nome":"Ester Emilly","email":"esterstudymed@gmail.com","telefone":"71999839135","cpf":"09098979564","cidade":"Pojuca","estado":"BA"},
  {"nome":"Ana Carolina Santos Lima","email":"ana.carolina.santos.limaa@gmail.com","telefone":"83987800655","cpf":"09144379412","cidade":"Patos","estado":"PB"},
  {"nome":"Eduarda Araujo","email":"eduardamaria.acosta@gmail.com","telefone":"83986285632","cpf":"15708841451","cidade":"Montadas","estado":"PB"},
  {"nome":"João Pedro de Medeiros Vanderlei Soares Barreiro","email":"joaopedromedeiros251@gmail.com","telefone":"83981914327","cpf":"70765969467","cidade":"João Pessoa","estado":"PB"},
  {"nome":"MARIANA PERDIGAO VIEGAS","email":"marianapviegas@yahoo.com.br","telefone":"31983867301","cpf":"09682316677","cidade":"Belo Horizonte","estado":"MG"},
  {"nome":"Autiberto da Conceiçao Morais","email":"autibertomorais@gmail.com","telefone":"83987705441","cpf":"05303390489","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Nielson Maycon de Sousa Lins","email":"nielsonmaycon9@gmail.com","telefone":"83998592551","cpf":"16219725425","cidade":"Brejo dos Santos","estado":"PB"},
  {"nome":"Maria Eduarda Oliveira","email":"oliveiraduuda10@gmail.com","telefone":"84996289758","cpf":"12002277435","cidade":"Pau dos Ferros","estado":"RN"},
  {"nome":"Camily Cavalcanti Silva","email":"ccs413123@gmail.com","telefone":"83994068414","cpf":"08399552437","cidade":"Guarabira","estado":"PB"},
  {"nome":"Ebert Ramos Souza Leitão Oliveira","email":"ebertrramos@gmail.com","telefone":"84981703044","cpf":"70742776492","cidade":"Ouro Branco","estado":"RN"},
  {"nome":"Jamilly Rayssa Gomes de Oliveira","email":"jamillyrayssa063@gmail.com","telefone":"83981861074","cpf":"14128949485","cidade":"Salgadinho","estado":"PB"},
  {"nome":"Maria Laura Dias","email":"lauradias0310@gmail.com","telefone":"81991976381","cpf":"13155365447","cidade":"Jaboatão dos Guararapes","estado":"PE"},
  {"nome":"Isabela Almeida","email":"danielaguimaraes1618@gmail.com","telefone":"83991252241","cpf":"10712149422","cidade":"João Pessoa","estado":"PB"},
  {"nome":"FERNANDA FAULIN CORREA","email":"faulinfernanda@gmail.com","telefone":"66996569445","cpf":"06054264141","cidade":"Rondonópolis","estado":"MT"},
  {"nome":"Marina Souza","email":"marinasouza3010@gmail.com","telefone":"84996313198","cpf":"70083715436","cidade":"Natal","estado":"RN"},
  {"nome":"Kauê Harrison","email":"kaueharrisonbrito@gmail.com","telefone":"83988863238","cpf":"10893484440","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Tarso Murilo Almeida","email":"tarsomurilo2@gmail.com","telefone":"83999550555","cpf":"12333052473","cidade":"Paulista","estado":"PB"},
  {"nome":"Bruna Assis Lima Leal","email":"brunaassislimaleal2008@gmail.com","telefone":"64999415378","cpf":"04642008144","cidade":"Jataí","estado":"GO"},
  {"nome":"Nathan Victor Pereira dos Santos","email":"nathanvictorpsantos@gmail.com","telefone":"83991130204","cpf":"09457930495","cidade":"Sapé","estado":"PB"},
  {"nome":"Elias Nascimento","email":"eliasnascimento0502@gmail.com","telefone":"82987353298","cpf":"09291157406","cidade":"Maceió","estado":"AL"},
  {"nome":"Maria Laura Da Costa Oliveira Souza","email":"marialauracosta2008@gmail.com","telefone":"82993401393","cpf":"10687781485","cidade":"Mar Vermelho","estado":"AL"},
  {"nome":"João Miguel Medeiros do Vale Pires","email":"joaomiguel.mvp@gmail.com","telefone":"84996027653","cpf":"11510980431","cidade":"Natal","estado":"RN"},
  {"nome":"Mabelly Évilly de Sousa Barreto","email":"mabellyevillydesousa@gmail.com","telefone":"83999823713","cpf":"07287681439","cidade":"Brejo dos Santos","estado":"PB"},
  {"nome":"Maria Vitória Santana de Oliveira","email":"vmaiusculo@gmail.com","telefone":"92986111130","cpf":"05547094226","cidade":"Montes Claros","estado":"MG"},
  {"nome":"Victor Hugo Vieira Oliveira Mattos","email":"vitinffgarena2007@gmail.com","telefone":"38999596968","cpf":"14613494605","cidade":"Chapada Gaúcha","estado":"MG"},
  {"nome":"Maria Eduarda Santiago Farias Maia","email":"eduarda.santiago@hotmail.com","telefone":"88996649065","cpf":"08155233359","cidade":"Limoeiro do Norte","estado":"CE"},
  {"nome":"Otavio Tayronny de Lima","email":"tlstudies5@gmail.com","telefone":"84999887401","cpf":"10708609481","cidade":"Pau dos Ferros","estado":"RN"},
  {"nome":"Yasmin Kalins","email":"yasminkalinsdr@gmail.com","telefone":"83993225324","cpf":"16174299457","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Renato Lima Dantas","email":"renatodantasfilho07@gmail.com","telefone":"83993511779","cpf":"09333393480","cidade":"Pocinhos","estado":"PB"},
  {"nome":"Alana Nathalia Pereira Gomes","email":"alana.assessoria526@gmail.com","telefone":"87999088013","cpf":"09756394471","cidade":"Recife","estado":"PE"},
  {"nome":"Stéphany Maria Pereira Ramos","email":"smpr20006@gmail.com","telefone":"82998335364","cpf":"14574309407","cidade":"Igaci","estado":"AL"},
  {"nome":"Geovana Bezerra de Araujo","email":"escolargeovanabez@gmail.com","telefone":"84999119248","cpf":"01713642441","cidade":"Parnamirim","estado":"RN"},
  {"nome":"Ana Maria Gonçalves de Almeida Holanda","email":"anecamareca@gmail.com","telefone":"83991695974","cpf":"09861900470","cidade":"João Pessoa","estado":"PB"},
  {"nome":"sara almeida souza","email":"saraalmeida1328@gmail.com","telefone":"96981376026","cpf":"05316466292","cidade":"Macapá","estado":"AP"},
  {"nome":"Joany Sara Medeiros Ribeiro","email":"joany.saraa361@gmail.com","telefone":"83999727718","cpf":"15515510470","cidade":"Nova Floresta","estado":"PB"},
  {"nome":"Ana Clara Borges Guimarães","email":"anaclarabguimaraes11@gmail.com","telefone":"34997198978","cpf":"13234800642","cidade":"Vazante","estado":"MG"},
  {"nome":"Joanderson Da Silva Cardoso","email":"joandersonc065@gmail.com","telefone":"83999493918","cpf":"09157095469","cidade":"Pilões","estado":"PB"},
  {"nome":"Larissa Correa Javarini","email":"larissacjavarini@hotmail.com","telefone":"27997737659","cpf":"14756934781","cidade":"Cariacica","estado":"ES"},
  {"nome":"RICARDO MORAES","email":"ricardosatmoraes@gmail.com","telefone":"71991175140","cpf":"07175424590","cidade":"Salvador","estado":"BA"},
  {"nome":"Luis Gustavo da Rocha Ribeiro","email":"luisgustavodarocharibeiro@gmail.com","telefone":"84999792712","cpf":"13339853479","cidade":"Açu","estado":"RN"},
  {"nome":"JOSILENE LOPES PACHECO","email":"analopes1607@gmail.com","telefone":"87996761278","cpf":"10477574432","cidade":"Petrolina","estado":"PE"},
  {"nome":"Juliana Agra","email":"julianaagra.ms@gmail.com","telefone":"87991147366","cpf":"15466593400","cidade":"Salgueiro","estado":"PE"},
  {"nome":"Maria Carolina dos Santos Alves","email":"mariacarolinadossantosalves93@gmail.com","telefone":"83991179398","cpf":"71369076401","cidade":"João Pessoa","estado":"PB"},
  {"nome":"Ayane Maia","email":"ayane.maia@yahoo.com","telefone":"84987390896","cpf":"11884577482","cidade":"Mossoró","estado":"RN"},
  {"nome":"Anna Livia Galdino Tavares","email":"annaliviagaldino2003@gmail.com","telefone":"83996859635","cpf":"16821265445","cidade":"Carrapateira","estado":"PB"},
  {"nome":"Mariana Teixeira Catunda","email":"cteixeiramariana@gmail.com","telefone":"83987122006","cpf":"08596040471","cidade":"Campina Grande","estado":"PB"},
  {"nome":"Ana Letícia Seal","email":"analeticiaseal@gmail.com","telefone":"81995766708","cpf":"71206803401","cidade":"Recife","estado":"PE"},
  {"nome":"Thais Rodrigues correia","email":"eduardamaria.acosta@gmail.com","telefone":"63992807373","cpf":"05997147193"},
  {"nome":"Nélio Antas Pereira","email":"nelioantas@hotmail.com","telefone":"81998363692","cpf":"02546919431"},
  {"nome":"Carlos Emanoel Alves de Lima","email":"emanoelalves138@gmail.com","telefone":"84981332139","cpf":"70695693433","cidade":"Venha-Ver","estado":"RN"},
  {"nome":"Gabriela Tormes","email":"gabitormes@gmail.com","telefone":"54996600628","cpf":"02315366070"},
  {"nome":"Luara Sampaio","email":"sampaioluara8@gmail.com","telefone":"74988183021","cpf":"09219437503"},
  {"nome":"Ana Clara Vicentim Roncolatto","email":"anaclaravicen.escola@gmail.com","telefone":"16996000411","cpf":"49237862806","cidade":"Guariba","estado":"SP"},
  {"nome":"Lucas Medeiros Leite","email":"lucasmleite09@gmail.com","telefone":"84987049568","cpf":"11165141418","cidade":"Parnamirim","estado":"RN"},
  {"nome":"Yasmin Brito Diniz","email":"yasminbd321@gmail.com","telefone":"98992028846","cpf":"62194475303","cidade":"São José de Ribamar","estado":"MA"},
  {"nome":"Karen Kellen","email":"karenkellen.00000@gmail.com","telefone":"87981053774","cpf":"13565515481","cidade":"Custódia","estado":"PE"},
  {"nome":"Arielly Chaves","email":"ariellychaves28@gmail.com","telefone":"83986204655","cpf":"11837661499","cidade":"Campina Grande","estado":"PB"},
  {"nome":"Elaine Aniele","email":"elaineaniele16@gmail.com","telefone":"84999744198","cpf":"70633318418","cidade":"Florânia","estado":"RN"},
  {"nome":"Maria Isabel Santiago","email":"cordeiromariaisabel3@gmail.com","telefone":"83991127256","cpf":"10120214407","cidade":"Campina Grande","estado":"PB"},
  {"nome":"Lowsllene Barrozo Pinheiro","email":"loohcarvalho16@gmail.com","telefone":"91984799613","cpf":"04516506203"},
  {"nome":"Julia Gabriely Cabral de Melo Oliveira","email":"juliagabriely2812@gmail.com","telefone":"81982972003","cpf":"15481771489"},
  {"nome":"Poliana Gomes Martins","email":"poligm114@gmail.com","telefone":"55996839211","cpf":"03805970048"},
  {"nome":"karla dos santos","email":"inkarlaaraujo57@gmail.com","telefone":"75998617967","cpf":"08854389579"},
  {"nome":"Carla Beatriz Leal Pereira","email":"carla.pereira0522@gmail.com","telefone":"81984424867","cpf":"12779611405"},
  {"nome":"Joao Miguel","email":"joaomiguel240605@gmail.com","telefone":"81993789204","cpf":"15592752431"},
  {"nome":"Gustavo Gomes","email":"gustavodiasldm@gmail.com","telefone":"83996757581","cpf":"08444824470"},
  {"nome":"Isa Gomes Souza","email":"isagomesde@gmail.com","telefone":"84987618891","cpf":"12934302423"},
  {"nome":"Maria Jorgiane Otaviano de Abreu","email":"abreu.mariajo@gmail.com","telefone":"21965365767","cpf":"14574931795"},
  {"nome":"Luiz Augusto CAvalcante da Silva Augusto","email":"luizaugustocrf@gmail.com","telefone":"85987315503","cpf":"10421956330"},
  {"nome":"Dandara vitoria Lopes mangueira","email":"dandaravitoria389@gmail.com","telefone":"83999750886","cpf":"05063588441"},
  {"nome":"Clarissa Vitória Marinho de Sousa","email":"clarissavmsousa@gmail.com","telefone":"83991280426","cpf":"10980680417"},
  {"nome":"Maria Vitória de Araújo Mourão","email":"vitoriamaria.mourao@gmail.com","telefone":"95991332830","cpf":"06896466316"},
  {"nome":"Nathalia Christina de Oliveira Linhares","email":"nathaliarn@hotmail.com","telefone":"84996468796","cpf":"09337553414"},
  {"nome":"André Vinícius Figueiredo","email":"andrevinitjf@hotmail.com","telefone":"81983734915","cpf":"70785423478"},
  {"nome":"Gustavo André","email":"cordeiro2006gacs@gmail.com","telefone":"31998704056","cpf":"16649762644"},
  {"nome":"renata ohanny","email":"renata.moreira21@outlook.com","telefone":"84991658782","cpf":"09949974429"},
  {"nome":"Nathalia dos Santos Fernandes","email":"nathalia1305@gmail.com","telefone":"21994876382","cpf":"15846560776"},
  {"nome":"Isabel Carolina Souza Mota","email":"souza.carolina2018@gmail.com","telefone":"61982345820","cpf":"05015837186"},
  {"nome":"Joana Darc Carvalho","email":"joanadarccarvalho.m@gmail.com","telefone":"85997878914","cpf":"60136060307"},
  {"nome":"FERNANDA ANJOS","email":"fernandadadiere@gmail.com","telefone":"92985006965","cpf":"02202942246"},
  {"nome":"Halana Correia","email":"halanaavieira@gmail.com","telefone":"81999814420","cpf":"10183328477"},
  {"nome":"Joao Lucas","email":"joaolucasoruis@gmail.com","telefone":"92994227723","cpf":"07857611280"},
  {"nome":"Marcela Vicente","email":"marcelamyranda@yahoo.com.br","telefone":"44999747459","cpf":"37082126816"},
  {"nome":"Giulia Marconi de Souza","email":"giulia.marconi2007@gmail.com","telefone":"22998661632","cpf":"14279717737"},
  {"nome":"Tauã Lins","email":"linstaua10@gmail.com","telefone":"83996318078","cpf":"11477656421"},
  {"nome":"Carolina Silva MONTENEGRO","email":"carolynamontenegro@hotmail.com","telefone":"83987143313","cpf":"00901745421"},
  {"nome":"Murilo Henrique Soares Dias Rêgo","email":"murilohenriquee16078@gmail.com","telefone":"84996000049","cpf":"10575525428"},
  {"nome":"Kalley Ferreira Nunes","email":"kalleyferreiranunes@gmail.com","telefone":"83999717640","cpf":"14279334480"},
  {"nome":"Gustavo Faustino","email":"gustavofaustino66@gmail.com","telefone":"84996959551","cpf":"13148644409"},
  {"nome":"Mônica Mayra Sousa Formiga Nobre","email":"monicamayra106@gmail.com","telefone":"83981544867","cpf":"11527719499"},
  {"nome":"Antonella Mendes","email":"antonella.mendes02@gmail.com","telefone":"27997909909","cpf":"06294422744"},
  {"nome":"Joao Gabriel Silveira","email":"joao.sf.nogueira8@gmail.com","telefone":"83998960923","cpf":"09835691428"},
  {"nome":"Gabriel Dutra","email":"igabrieldutras@gmail.com","telefone":"66992043512","cpf":"05340615162"},
  {"nome":"Matheus Almeida Forte","email":"matheussbpb11@gmail.com","telefone":"83998875237","cpf":"70526120460"},
  {"nome":"Eduardo Barbosa","email":"eduardobsantos009@gmail.com","telefone":"82981120364","cpf":"11537940473"},
  {"nome":"José Carlos do Vale Conceição","email":"zhevally4656@gmail.com","telefone":"75991850588","cpf":"08240062598"},
  {"nome":"Luana Beatriz Soares Costa","email":"luanabeatriz2110@gmail.com","telefone":"83987866078","cpf":"09294093450"},
  {"nome":"Gabriela Souza","email":"brunoandretti1000@hotmail.com","telefone":"84981143035","cpf":"70761250484"},
  {"nome":"Sylvia Rodrigues","email":"sylviaserenna@gmail.com","telefone":"83998842000","cpf":"02793979414"},
  {"nome":"Mariana Lemos","email":"marilemosba@gmail.com","telefone":"88996807953","cpf":"62244848302"},
  {"nome":"Laisa Lima","email":"laisadelima07@gmail.com","telefone":"11954587492","cpf":"50944897800"},
  {"nome":"Thales Ryan Monteiro da Paz Sousa","email":"thalesryanx9@gmail.com","telefone":"83999078655","cpf":"11749256479"},
  {"nome":"Anne Karoline de Abreu","email":"akarolabreu16@hotmail.com","telefone":"77998239205","cpf":"05102632590"},
  {"nome":"Laynes Bruna da Silva","email":"studylaylay@gmail.com","telefone":"91984167481","cpf":"07370562239"},
  {"nome":"Miguel José de Andrade Resende","email":"miguelresende600@gmail.com","telefone":"31982191341","cpf":"03661711601"},
  {"nome":"Fernanda Fonseca","email":"fonsecafernanda889@gmail.com","telefone":"84996844486","cpf":"08678776420"},
  {"nome":"Julia Morais","email":"juliamorais1001@gmail.com","telefone":"84994880530","cpf":"08060663429"},
  {"nome":"Maria Clara de Almeida Costa","email":"m.lucia.acosta@hotmail.com","telefone":"83989160030","cpf":"01859868460"},
  {"nome":"Vitória Soares","email":"vitoriasoaressousa1@gmail.com","telefone":"84998431581","cpf":"10392780437"},
  {"nome":"Patricia Gonçalves de Oliveira","email":"patriciaoliveirag124@gmail.com","telefone":"88997131646","cpf":"48652410860"},
  {"nome":"Ana Clara Morais Carneiro","email":"anaclaramoraiscarneiro@gmail.com","telefone":"91984754185","cpf":"02579144200"},
  {"nome":"Júlia Lara","email":"larajuliaop12@gmail.com","telefone":"32998355704","cpf":"17054122623"},
  {"nome":"Ana Luiza Ferreira de Melo","email":"luizanamelo14@gmail.com","telefone":"84998014592","cpf":"01659700493"},
  {"nome":"Isabella Abreu","email":"isabellaasantos2504@gmail.com","telefone":"11948344753","cpf":"38805398802"},
  {"nome":"Isllan Ruy Lins Andrade","email":"isllansjp2016@gmail.com","telefone":"83991948538","cpf":"09191008484"},
  {"nome":"Pedro Fernandes","email":"jp.pedro.jpf@gmail.com","telefone":"84988423809","cpf":"12002507457"},
  {"nome":"Hemilly Kauanny","email":"victoria.jmly@gmail.com","telefone":"88993784923","cpf":"08277270380"},
  {"nome":"Iasmin Vitória","email":"iasmin.vitoria142@gmail.com","telefone":"74981438580","cpf":"08355662504"},
  {"nome":"Ariana Ferreira Miranda","email":"arianafm86@gmail.com","telefone":"21985211040","cpf":"00934680329"},
  {"nome":"Sarah Freitas","email":"sarahlbezerraf@gmail.com","telefone":"88999744073","cpf":"61091337365"},
  {"nome":"Thayllane Lima de Sá Costa","email":"thayllane_lima@hotmail.com","telefone":"84981661791","cpf":"10429783442"},
  {"nome":"Augusto Deivid","email":"augustodeivid86@gmail.com","telefone":"84999032033","cpf":"08286502418"},
  {"nome":"Camila Lopes da Costa","email":"solpesestudos@gmail.com","telefone":"61991196081","cpf":"06697303190"},
  {"nome":"Maria Clara","email":"mariacl20191@outlook.com","telefone":"84994730888","cpf":"71320549454"},
  {"nome":"João Victor Ferreira Gabriel","email":"joaovferreirag2007@gmail.com","telefone":"87999900173","cpf":"12273306423"},
  {"nome":"Ana Clara Sena Ribeiro","email":"anaclarasena7210@gmail.com","telefone":"98988040583","cpf":"61733221379"},
  {"nome":"Daniela Lima","email":"daniela.antonia2006@gmail.com","telefone":"82993654114","cpf":"09398188414"},
  {"nome":"João Patrick de Oliveira Silva","email":"joaopatrick626@gmail.com","telefone":"82993256347","cpf":"06878248426"},
  {"nome":"Maria Gabriela a Silva Soares","email":"gabiistudiiess@gmail.com","telefone":"86999016835","cpf":"06605851382"},
  {"nome":"Eduardo Henrique Da Cruz Oliveira","email":"eduardomeneghimhenrique@gmail.com","telefone":"87991647097","cpf":"70850868408"},
  {"nome":"isadora peixoto","email":"satessio2021@gmail.com","telefone":"83991116808","cpf":"12136162470"},
  {"nome":"Rebeka Rianny","email":"riannyrebekaa@gmail.com","telefone":"88997072515","cpf":"08906694300"},
  {"nome":"Gabriela Barbosa Gomes","email":"gabrielabg2007@gmail.com","telefone":"83999020045","cpf":"20796198705"},
  {"nome":"Laize Kalyne","email":"laizekln@gmail.com","telefone":"84998173112","cpf":"12940158428"},
  {"nome":"Jádina Fonseca Coelho","email":"jadynafonseca@gmail.com","telefone":"94984191766","cpf":"04305713217"},
  // Alunos SEM CPF mas COM EMAIL (vão ser cadastrados via email)
  {"nome":"Larissa Almeida Souza","email":"larissa.study.med@gmail.com","telefone":"79998919092"},
  {"nome":"Matheus Santos Vieira","email":"matheussantossvieira50@gmail.com","telefone":"79981010021"},
  {"nome":"YASMIN LACERDA","email":"yasmiinfl18@gmail.com","telefone":"83999268228"},
  {"nome":"Geovanna Pyetra Honorata Lucena de Oliveira","email":"geovannnapyetra@gmail.com","telefone":"83998501706"},
  {"nome":"Mariana Silva Vieira","email":"marianasilvavieira2020@gmail.com","telefone":"32999228503"},
  {"nome":"Ana Clara Guedes","email":"lucianaclaraemanuel@gmail.com","telefone":"83993836763"},
  {"nome":"Jose victor Viana","email":"negoviana777@gmail.com","telefone":"84991462265"},
  {"nome":"Gabriela Dutra","email":"gabrielamdc19@gmail.com","telefone":"83998139326"},
  {"nome":"BRUNNO FARIAS","email":"brunnohfs@hotmail.com","telefone":"83993184020"},
  {"nome":"Maria Clara Da Silva Olegário","email":"mariaclaraolegario13@gmail.com","telefone":"83981026408"},
  {"nome":"Clara Mesquita","email":"bea17clara@gmail.com","telefone":"83999449899"},
  {"nome":"Ana Beatriz de Mendonça Bandeira","email":"beatrizmendoncapb@gmail.com","telefone":"83986632849"},
  {"nome":"Amannda Lucena Fragoso Campos Cavalcanti","email":"amanndalucenafragoso@gmail.com","telefone":"83999143798"},
  {"nome":"Júlia Ferreira Barbosa","email":"juferreirab06@gmail.com","telefone":"84999466556"},
  {"nome":"Arthur Galdino da Silva","email":"arthurgaldino761@gmail.com","telefone":"81988840378"},
  {"nome":"ARTHUR RIQUELMY MENEZES SANTOS","email":"arthuriquelmy@gmail.com","telefone":"83988408705"},
  {"nome":"Lara Vitória","email":"thayseviana@hotmail.com","telefone":"83988847093"},
  {"nome":"Nathália Estrela Mendes","email":"nathyestrela99@gmail.com","telefone":"84996610913"},
  {"nome":"Mateus Fernandes Pontara","email":"mateusfernandes1c6@gmail.com","telefone":"31971628441","cpf":"70191277622"},
  {"nome":"ILLANA CAROLINA SILVA DE OLIVEIRA","email":"illana_carolzinha@hotmail.com","telefone":"84981331919"},
  {"nome":"Ana Clara Barbosa Menezes","email":"anajasnna@gmail.com","telefone":"84999934660"},
  {"nome":"Pedro Ivo Penha Trindade","email":"pedroivo20072809@gmail.com","telefone":"84991889065"},
  {"nome":"Heitor Alcântara","email":"heitoralcantara06@gmail.com","telefone":"87981080807"},
  {"nome":"Lorrane De Oliveira santos","email":"lorraneoliveira78@icloud.com","telefone":"79998840035"},
  {"nome":"Luandson Teixeira Lima","email":"luandsontxeira@gmail.com","telefone":"83996999097"},
  {"nome":"Miguel Ferreira Borges","email":"miguelfborges@hotmail.com","telefone":"84996523396"},
  {"nome":"Isabela Tigre","email":"isabelatigre6@gmail.com","telefone":"11940894050"},
  {"nome":"Paula Farias Lopes Pachú","email":"paula018877@aluno.colegiomotiva.com.br","telefone":"83991789229"},
  {"nome":"Raíssa Moura Campos","email":"raissamouracampos2007@gmail.com","telefone":"86994006606"},
  {"nome":"Ana Laura Silva Soares","email":"sanalaura294@gmail.com","telefone":"84992087499"},
  {"nome":"Emenly Alessandra Alessandra","email":"emenlybrandao@gmail.com","telefone":"81984949162"},
  {"nome":"Gabriel Muniz","email":"gabriel.muniz13@icloud.com","telefone":"81996785906"},
  {"nome":"Rilka Pereira","email":"pereirarilka@gmail.com","telefone":"88981725940"},
  {"nome":"Ingrid Karoline pereira dos santos","email":"ingridkps3251@gmail.com","telefone":"85996616551"},
  {"nome":"Amazônia Dos Santos Campos","email":"danielacampos252008@gmail.com","telefone":"88992332963"},
  {"nome":"Júlia Do Nascimento Silva","email":"juliadonascimentosilva3@gmail.com","telefone":"83986953382"},
  {"nome":"Tiago Lima","email":"tiagolimahmarques@gmail.com","telefone":"83998561412"},
  {"nome":"Marya Clara Domiciano Cabral Dutra","email":"dutra.maryaclara@gmail.com","telefone":"83999866722"},
  {"nome":"Juliane jamilly","email":"juliany_jamilly@hotmail.com","telefone":"84987125149"},
  {"nome":"Mateus Arruda","email":"mateus.arrn@gmail.com","telefone":"83996908677"},
  {"nome":"Alanna Ferreira","email":"alannafnascimento@gmail.com","telefone":"83999554362"},
  {"nome":"Izabel Fernanda","email":"izzabelfernanda@gmail.com","telefone":"84988152293"},
  {"nome":"natalia carneiro leal","email":"natalia.carneiro.leal@gmail.com","telefone":"83996851789"},
  {"nome":"Julia Soares Carvalho","email":"juliasoarescarvalho@yahoo.com","telefone":"84988434685"},
  {"nome":"Célio Cabral de Arruda Melo Filho","email":"celio.filho002@gmail.com","telefone":"81988821310"},
  {"nome":"Letícia Rocha","email":"leticia.rs.0714@gmail.com","telefone":"83987270964"},
  {"nome":"Ana Júlia Abrantes da Silva","email":"anajuliam36@gmail.com","telefone":"87999149189"},
  {"nome":"Dr. Galindo","email":"guilhermegalindo356@gmail.com","telefone":"81973469316"},
  {"nome":"Hyano Trigueiro","email":"hyanotfilho@gmail.com","telefone":"83996614591"},
  {"nome":"Valmir Alves Rodrigues Filho","email":"valmirfilho20157@gmail.com","telefone":"83989047552"},
  {"nome":"Patricia Lima Rodrigues","email":"patylimar23@gmail.com","telefone":"85991597142"},
  {"nome":"Evillyn Maria Almeida","email":"evillynmariaalmeida@gmail.com","telefone":"83998937860"},
  {"nome":"Dara Sabrina","email":"dara.sabrina@hotmail.com","telefone":"84998141258"},
  {"nome":"Ana Emilia Arnaud","email":"arnaudanaemilia@gmail.com","telefone":"83991027932"},
  {"nome":"Emmanuelly ferreira","email":"emmanuellyferreira880@gmail.com","telefone":"83988108209"},
  {"nome":"Javanna Lacerda","email":"javanna.lacerdaa@gmail.com","telefone":"81982101203"},
  {"nome":"Ana Luiza Baldório Batista","email":"mahdubaldorio@icloud.com","telefone":"45999109545"},
  {"nome":"Vitória Camily Vidal Guedes","email":"camilyvitoriavg@gmail.com","telefone":"84988530682"},
  {"nome":"Raul Humberto Pachú Silva","email":"raulpachu50.rh@gmail.com","telefone":"71992406845"},
  {"nome":"Carlos eduardo Medeiros de oliveira","email":"duducarlosmedeiros107@gmail.com","telefone":"83999449753"},
  {"nome":"Bruno Soares","email":"bruno.bernardosoares15@gmail.com","telefone":"83982173339"},
  {"nome":"Ana Laura Gomes Maranhao","email":"mv986962@gmail.com","telefone":"87981350679"},
  {"nome":"Bruna Silva","email":"brunasilvasoares54@gmail.com","telefone":"83993764364"},
  {"nome":"José Eduardo Adelino Silva","email":"jeduardoadelino@gmail.com","telefone":"83998278059"},
  {"nome":"Heitor Marinho","email":"heitormnleite@gmail.com","telefone":"83999150242"},
  {"nome":"João Guilherme Ferreira da Silva","email":"gui27fs@gmail.com","telefone":"88986330448"},
  {"nome":"Maria Luíza Araújo dos Santos","email":"malu.araujo11@gmail.com","telefone":"84988548573"},
  {"nome":"HENRIQUE MOLINARI","email":"henriquefmolinari@gmail.com","telefone":"83981803358"},
  {"nome":"Dr. Miranda","email":"matheuspb2302@gmail.com","telefone":"83991066973"},
  {"nome":"Lucia Ellen Teodosio Pereira","email":"luciaellentp@gmail.com","telefone":"83988904549"},
  {"nome":"Edivanda Henriques de Andrade","email":"samillyandradeferreira3@gmail.com","telefone":"83982853020"},
  {"nome":"Ana Carolina Silva Cerqueira","email":"ccerqueirw@gmail.com","telefone":"13974035906"},
  {"nome":"Maria Enyla Figueiredo Rodrigues","email":"enyla.figueiredo@gmail.com","telefone":"83996031493"},
  {"nome":"Alice Silva","email":"alice.assu099087@gmail.com","telefone":"84998454696"},
  {"nome":"Ana Clarice Marcelino De Lima","email":"marcelinoanaclarice@gmail.com","telefone":"84987972984"},
  {"nome":"Kathariny Costa Soares","email":"kathariny.c.soares@gmail.com","telefone":"82996147486"},
  {"nome":"isabella viana","email":"isabellasoaresv@gmail.com","telefone":"83988845669"},
  {"nome":"Yasmin Vitória Fonseca Gadelha","email":"yasminvit1500@gmail.com","telefone":"83986369212"},
  {"nome":"Cássio Luna de Sant Ana Costa","email":"cassioteve@gmail.com","telefone":"83987618078"},
  {"nome":"giovanna lara ângelo padilha de carvalho","email":"giopadilhacarvalho@gmail.com","telefone":"83996122684"},
  {"nome":"Lays bruna Costa","email":"layscostabruna@gmail.com","telefone":"83988849006"},
  {"nome":"Hamilton Cristyan Lima de Noronha","email":"hamiltoncristyan@gmail.com","telefone":"84991224676"},
  {"nome":"Elimaewe Pereira de Araújo","email":"elimaewearaujo@gmail.com","telefone":"88997479599"},
  {"nome":"Maria Eduarda Figueiredo da Silveira Cruz","email":"dudafsilveiracruz@gmail.com","telefone":"83998950307"},
  {"nome":"Hellen Souza","email":"hnsouza30@gmail.com","telefone":"96981021934"},
  {"nome":"Laiza Kalyane","email":"laiza.laiza234@gmail.com","telefone":"84999874070"},
  {"nome":"DÉBORA MIRANDA MAGALHÃES","email":"magalhaesdebora41@gmail.com","telefone":"24998419929"},
  {"nome":"Adassa Evelyn Vitorino Guimarães","email":"adassavitorinoguimaraesvitorin@gmail.com","telefone":"84998314539"},
  {"nome":"Thaís Moraes","email":"thaismdq@gmail.com","telefone":"83988736363"},
  {"nome":"Carolina Nogueira Santos","email":"nogueiras.carolinas@gmail.com","telefone":"83991817070"},
  {"nome":"Vinicius Vasco","email":"viniciusvasco112@gmail.com","telefone":"83993903394"},
  {"nome":"Herik Nunes","email":"heriknunes180405@gmail.com","telefone":"84996488968"},
  {"nome":"Vitória Maria Basílio Bezerra","email":"vitoriamariabasilio@gmail.com","telefone":"83996921682"},
  {"nome":"Dra. Eloise Torres","email":"eribertotorres.viver@gmail.com","telefone":"84996569119"},
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const defaultPassword = 'eneM2026@#';
  const tipoProduto = 'Livro Web';
  const fonte = 'Importação BRUNA LISTA ONLINE 20/01 - Direct';
  const expirationDays = 365;

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  console.log(`[direct-bulk] Iniciando importação de ${STUDENTS_DATA.length} alunos`);

  for (let i = 0; i < STUDENTS_DATA.length; i++) {
    const student = STUDENTS_DATA[i] as any;
    const nome = String(student.nome || '').trim();
    const email = String(student.email || '').trim().toLowerCase();
    const cpfRaw = String(student.cpf || '').replace(/\D/g, '');
    const cpfClean = cpfRaw ? cpfRaw.padStart(11, '0') : '';
    const telefone = String(student.telefone || '').replace(/\D/g, '') || null;

    if (!nome) {
      skippedCount++;
      continue;
    }

    const hasCpf = cpfClean.length >= 10;
    const hasEmail = !!email;
    
    if (!hasCpf && !hasEmail) {
      skippedCount++;
      continue;
    }

    // Validar CPF se presente
    if (hasCpf && !validateCPFFormat(cpfClean)) {
      errors.push(`${nome}: CPF inválido`);
      errorCount++;
      continue;
    }

    // Verificar duplicidade de CPF
    if (hasCpf) {
      const { data: existingCPF } = await adminClient.from('alunos').select('id').eq('cpf', cpfClean).maybeSingle();
      if (existingCPF) {
        skippedCount++;
        continue;
      }
    }

    // Verificar duplicidade de email
    if (hasEmail) {
      const { data: existingEmail } = await adminClient.from('alunos').select('id').eq('email', email).maybeSingle();
      if (existingEmail) {
        skippedCount++;
        continue;
      }
    }

    // Se não tem email, apenas registra sem acesso
    if (!hasEmail) {
      await adminClient.from('alunos').insert({
        nome,
        email: `sem-email-${cpfClean}@placeholder.local`,
        cpf: cpfClean,
        telefone,
        cidade: student.cidade || null,
        estado: student.estado || null,
        status: 'Pendente',
        fonte,
        tipo_produto: tipoProduto,
        data_matricula: new Date().toISOString().split('T')[0],
      });
      skippedCount++;
      continue;
    }

    // Criar auth user
    const userMetadata: Record<string, unknown> = { nome };
    if (hasCpf) userMetadata.cpf = cpfClean;

    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (createAuthError || !authData.user) {
      errors.push(`${nome}: ${createAuthError?.message || 'Auth error'}`);
      errorCount++;
      continue;
    }

    const userId = authData.user.id;

    // Criar profile
    await adminClient.from('profiles').upsert({
      id: userId,
      email,
      nome,
      cpf: hasCpf ? cpfClean : null,
      phone: telefone,
      password_change_required: true,
      onboarding_completed: false,
    }, { onConflict: 'id' });

    // Atribuir role beta_expira
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    await adminClient.from('user_roles').upsert({
      user_id: userId,
      role: 'beta_expira',
      expires_at: expiresAt.toISOString(),
    }, { onConflict: 'user_id' });

    // Criar entrada em alunos
    await adminClient.from('alunos').insert({
      nome,
      email,
      cpf: hasCpf ? cpfClean : null,
      telefone,
      cidade: student.cidade || null,
      estado: student.estado || null,
      status: 'Ativo',
      fonte,
      tipo_produto: tipoProduto,
      data_matricula: new Date().toISOString().split('T')[0],
    });

    successCount++;

    if ((i + 1) % 25 === 0) {
      console.log(`[direct-bulk] Progresso: ${i + 1}/${STUDENTS_DATA.length}`);
    }
  }

  console.log(`[direct-bulk] Finalizado: ${successCount} sucesso, ${errorCount} erros, ${skippedCount} pulados`);

  return new Response(JSON.stringify({
    success: true,
    total: STUDENTS_DATA.length,
    successCount,
    errorCount,
    skippedCount,
    errors: errors.slice(0, 50),
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
