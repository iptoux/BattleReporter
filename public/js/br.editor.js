	!function(battlereport, teamNames, combatants, editor, changes, ships, custIdx){
		if (!battlereport) return;
		teamNames = ['teamA', 'teamB', 'teamC'];
		combatants = [];
		changes = {};
		ships = {};
		custIdx = 0;
		function hoverCombatants(el) {
			if (!el) return;
			el.hover(function () {
				var el = $(this),
					cmbt = getCombatant(el.attr('data-combatant-id')),
					cnt = el.find('.combatant-details');
				if (!cmbt) { console.log("no combatant found"); return; }
				cnt.css('position', 'relative');
				editor.attr('class', '');
				if (cmbt._team == 'teamA') editor.addClass('not-movable-left');
				if (cmbt._team == 'teamC') editor.addClass('not-movable-right');
				if (cmbt.brCombatantID < 0 || cmbt.brManuallyAdded)
					editor.addClass('not-hideable').addClass('not-showable');
				else
					editor.addClass('not-trashable').addClass(cmbt.brHidden ? 'not-hideable' : 'not-showable');
				if (cmbt.died)
					editor.addClass(cmbt.brHidden ? 'not-showable' : 'not-hideable');
				editor.appendTo(cnt).show();
			}, function () {
				editor.hide();
			});
		}
		function addCombatant(team, combatant) {
			if (!team || !combatant)
				return;
			var tbl = $('#battlereport-' + team);
			if (!('brCombatantID' in combatant))
				combatant.brCombatantID = (--custIdx);
			combatant._team = team;
			combatants.push(combatant);
			changes[combatant.brCombatantID] = changes[combatant.brCombatantID] || {
				added: true,
				teamName: team,
				combatantInfo: combatant
			};
			hoverCombatants($(document.createElement('tr')).addClass('combatant').attr('data-combatant-id', combatant.brCombatantID).html(
				'<td><img src="//image.eveonline.com/InventoryType/' + (ships[combatant.shipTypeName] || 0) + '_64.png"></td>' +
				'<td style="width:100%">' +
					'<div class="combatant-details">' +
						(!!combatant.characterName ? ('<strong>' + combatant.characterName + '</strong>') : '<em>Unknown</em>') + '<br>' +
						'<small>' + (combatant.corporationName || '<em>Unknown</em>') +
							(!!combatant.allianceName > 0 ? ('<br>' + combatant.allianceName) : '') + '</small><br>' +
						combatant.shipTypeName +
						'<br>&nbsp;' +
					'</div>' +
				'</td>'
			).appendTo(tbl.find('tbody')));
		}
		function getCombatant(id) {
			if (typeof id == 'undefined') return null;
			l = combatants.length;
			while (l--) {
				if ((c = combatants[l]).brCombatantID == id) return c;
			}
			return null;
		}
		function handle(action, el) {
			var combatant = getCombatant(el.attr('data-combatant-id')),
				oldTeam, oldTeamIdx, idx, newTeamName;
			if (!combatant) return;
			switch (action) {
				case 'move-left':
					oldTeam = battlereport[combatant._team].members;
					oldTeamIdx = teamNames.indexOf(combatant._team);
					idx = oldTeam.indexOf(combatant);
					newTeamName = teamNames[(oldTeamIdx == 0 ? teamNames.length : oldTeamIdx) - 1];
					battlereport[(combatant._team = newTeamName)].members.push(combatant);
					el.appendTo($('#battlereport-' + newTeamName));
					changes[combatant.brCombatantID] = changes[combatant.brCombatantID] || {};
					changes[combatant.brCombatantID].teamName = newTeamName;
					break;
				case 'move-right':
					oldTeam = battlereport[combatant._team].members;
					oldTeamIdx = teamNames.indexOf(combatant._team);
					idx = oldTeam.indexOf(combatant);
					newTeamName = teamNames[((oldTeamIdx + 1) == teamNames.length ? -1 : oldTeamIdx) + 1];
					battlereport[(combatant._team = newTeamName)].members.push(combatant);
					el.appendTo($('#battlereport-' + newTeamName));
					changes[combatant.brCombatantID] = changes[combatant.brCombatantID] || {};
					changes[combatant.brCombatantID].teamName = newTeamName;
					break;
				case "hide-on-br":
					if (!combatant.died) {
						combatant.brHidden = true;
						el.addClass('hidden-on-br');
						changes[combatant.brCombatantID] = changes[combatant.brCombatantID] || {};
						changes[combatant.brCombatantID].brHidden = true;
					}
					break;
				case "show-on-br":
					combatant.brHidden = false;
					if (el.hasClass('hidden-on-br'))
						el.removeClass('hidden-on-br');
					changes[combatant.brCombatantID] = changes[combatant.brCombatantID] || {};
					changes[combatant.brCombatantID].brHidden = false;
					break;
				case "trash":
					combatant.brDeleted = true;
					el.detach();
					changes[combatant.brCombatantID] = changes[combatant.brCombatantID] || {};
					changes[combatant.brCombatantID].brDeleted = true;
					break;
			}
		}
		for (var teamName in battlereport) {
			if (teamNames.indexOf(teamName) == -1)
				continue;
			var team = battlereport[teamName],
				l = team.members.length,
				combatant;
			while (l--) {
				combatants.push(combatant = team.members[l]);
				combatant._team = teamName;
			}
		}
		editor = $('#editor-panel').css({
			position: 'absolute',
			bottom: 0, right: 0,
			width: 'auto', height: 'auto'
		});
		['move-left', 'move-right', 'show-on-br', 'hide-on-br', 'trash'].forEach(function (n) {
			$('#editor-panel .' + n).click(function (e) {
				e.preventDefault();
				handle(n, $(this).closest('.combatant'));
			});
		});
		$('*[data-combatant-id]').each(function () {
			hoverCombatants($(this));
		});
		$('.combatant-corpname').autocomplete({
			serviceUrl: '/autocomplete/corpNames',
			type: 'POST',
			onSelect: function (suggestion) {
				$(this).closest('.combatant-adding-form').find('.combatant-alliname').val(suggestion.data);
			}
		});
		$('.combatant-alliname').autocomplete({
			serviceUrl: '/autocomplete/alliNames',
			type: 'POST'
		});
		$('.combatant-shipname').autocomplete({
			serviceUrl: '/autocomplete/shipNames',
			type: 'POST',
			transformResult: function(response) {
				var s = [];
				if (!!response && !!(response = $.parseJSON(response)))
					s = $.map(response.ships, function(item) {
						if (!(item.name in ships)) ships[item.name] = item.id;
						return { value: item.name, data: item.id };
					});
				return {
					suggestions: s
				};
			}
		});
		$('.combatant-adding-form').submit(function (e) {
			e.preventDefault();
			var tr = $(this).closest('.combatant-adding-panel'),
				team = tr.closest('table').attr('id').replace(/^battlereport-/, ''),
				ship = tr.find('.combatant-shipname'),
				shipName = ship.val(),
				corp = tr.find('.combatant-corpname'),
				corpName = corp.val(),
				alli = tr.find('.combatant-alliname'),
				alliName = alli.val(),
				count = tr.find('.combatant-count'),
				n = Math.max(parseInt(count.val() || 1, 10) || 1, 1);
			alli.val('');
			corp.val('');
			ship.val('');
			count.val('1');
			if (!shipName)
				return;
			while (n--) addCombatant(team, { shipTypeName: shipName, corporationName: corpName, allianceName: alliName });
		});
		$('#save-br').click(function () {
			$('#battleReportChanges').val(JSON.stringify(changes));
			$('#battleReportEditor').submit();
		});
	}(typeof battleReport == 'undefined' ? null : battleReport);
	!function(tpl, add){
		if (typeof battleReport == 'undefined')
			return;
		function deleteFtg() {
			$(this).closest('.battle-footage-container').remove();
		}
		function upFtg() {
			var all = $('.complete-battle-footage').children('.battle-footage-container'),
				el = $(this).closest('.battle-footage-container'),
				idx;
			if ((idx = all.index(el)) <= 0) return;
			el.insertBefore(el.prev());
		}
		function dnFtg() {
			var all = $('.complete-battle-footage').children('.battle-footage-container'),
				el = $(this).closest('.battle-footage-container'),
				idx = all.index(el);
			if (idx >= (all.length - 1)) return;
			el.insertAfter(el.next());
		}
		function listenFtg(el) {
			el.find('button.delete-battle-footage').click(deleteFtg);
			el.find('button.move-battle-footage-up').click(upFtg);
			el.find('button.move-battle-footage-down').click(dnFtg);
			suggestPilot(el);
		}
		function suggestPilot(el) {
			var inp = el.find('input[name^=battleFootageCombatantCharName]'),
				id = el.find('input[name^=battleFootageCombatantID]');
			inp.autocomplete({
				serviceUrl: '/autocomplete/combatants/' + battleReport.battleReportID,
				type: 'POST',
				onSelect: function (suggestion) {
					id.val('');
					if (!!suggestion.data)
						id.val(suggestion.data);
					else
						inp.val('');
				},
				onInvalidateSelection: function () {
					id.val('');
				}
			}).blur(function () {
				if (!id.val())
					inp.val('');
			});
		}
		tpl = $('#battle-footage-template');
		$('.battle-footage-container').each(function () {
			listenFtg($(this));
		});
		(add = $('#add-battle-footage')).find('button.add-battle-footage').click(function () {
			var ftg = tpl.clone(),
				inp = add.find('input[name^=battleFootageUrl]');
			
			ftg.find('input[name^=battleFootageUrl]').val(inp.val());
			inp.val('');
			
			inp = add.find('input[name^=battleFootageCombatantID]');
			ftg.find('input[name^=battleFootageCombatantID]').val(inp.val());
			inp.val('');
			
			inp = add.find('input[name^=battleFootageCombatantCharName]');
			ftg.find('input[name^=battleFootageCombatantCharName]').val(inp.val());
			inp.val('');
			
			add.before(ftg);
			listenFtg(ftg);
		});
		suggestPilot(add);
	}();
