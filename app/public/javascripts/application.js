var socket = io();

/*
 * On document ready
 */
$(document).ready(function() {
    // Handshake
    socket.emit('handshake');
    // Prevent the enter key from submitting the form
    $('form.form-editor input').keypress(function(e) {
        if (e.key === 'Enter') e.preventDefault();
    });
    // Cycle through editor categories
    $('.button-editor').click(function() {
        if ($('.component-cv-builder').hasClass('occupied')) return;
        $('.button-editor').each(function() {
            if ($(this).hasClass('button-primary')) $($(this).data('show')).find('.button-make').click();
        });
        $($(this).data('hide')).hide();
        $('.button-editor.button-primary').removeClass('button-primary').addClass('button-info');
        $(this).removeClass('button-info').addClass('button-primary');
        $($(this).data('show')).show();
    });
    // Duplicate entry
    $('.button-entry-copy').click(function(e) {
        e.preventDefault();
        let $entry = $($(this).data('copy')).last();
        let $copy = $entry.clone();
        $copy.find('input').attr('placeholder', '');
        $copy.find('input').val('');
        $entry.after($copy);
    });
    // Remove entry
    $('.button-entry-remove').click(function(e) {
        e.preventDefault();
        if ($($(this).data('remove')).length > 2) {
            let $entry = $($(this).data('remove')).last();
            $entry.remove();
        }
    });
    // Compile CV
    $('.button-make').click(function(e) {
        e.preventDefault();
        let $form = $(this).closest('form.form-editor');
        let allClear = true;
        $form.find('input[required]').each(function() {
            $(this).removeClass('invalid');
            if ($(this).val() === '') {
                allClear = false;
                $(this).addClass('invalid');
            }
        });
        if (allClear) {
            let data = $form.serialize();
            socket.emit('make', $form.attr('id'), data);
            $('.button-make').each(function() {
                $($(this).data('toggle')).show();
                $(this).hide();
            });
            $('.component-cv-builder').addClass('occupied');
        }
    });
    // Remove data from server
    $('.button-remove').click(function(e) {
        e.preventDefault();
        let $form = $(this).closest('form.form-editor');
        socket.emit('remove', $form.attr('id'));
        $form.find('input').each(function() {
            $(this).val('');
        });
    });
    // Button for impatient people
    $('.button-patience').click(function(e) {
        e.preventDefault();
        socket.emit('impatient', $(this).closest('form.form-editor').attr('id'));
        $(this).blur();
    });
    // Modal close
    $('.button-err-close').click(function() {
        $('#err-mask, #err').fadeOut(200);
    });
    // Cycle through templates
    $('.template-carousel').on('change.flickity', function(e, index) {
        socket.emit('template', $(this).children().eq(index).data('template'));
    });
    // Third-party login button appearance
    $('.signin-strategy-button').on('mouseover', function() {
        $(this).children().hide();
        $(this).find('.signin-strategy-focus').show();
    }).on('mouseout', function() {
        $(this).children().hide();
        $(this).find('.signin-strategy-normal').show();
    });
    // Change content of impatience button
    socket.on('impatience-mock', function(id, mock) {
        $('#' + id).find('.button-patience .mock').html(mock);
    });
    // Initial variables from server
    socket.on('param', function(param) {
        $('.form-editor').each(function() {
            let key = $(this).attr('id');
            let mem = {};
            $(this).find('input').each(function() {
                let name = $(this).attr('name');
                let val;
                if (Array.isArray(param[key][name])) {
                    if (name in mem) {
                        mem[name]++;
                    } else {
                        mem[name] = 0;
                    }
                    val = param[key][name][mem[name]];
                } else {
                    val = param[key][name];
                }
                if (val !== '') $(this).attr('required', 'required');
                $(this).attr('placeholder', val);
            });
            $(this).find('.button-patience .mock').html(param.impatienceMock[0]);
        });
    });
    // Load pdf in viewer
    socket.on('pdf', function(viewer) {
        $('.pdf-viewer').attr('src', viewer);
        $('.button-make').each(function() {
            $($(this).data('toggle')).hide();
            $(this).show();
        });
        $('.component-cv-builder').removeClass('occupied');
    });
    // Error modal
    socket.on('err', function(err) {
        $('#err').find('.content').html(err);
        $('#err-mask, #err').fadeIn(200);
        $('.button-make').each(function() {
            $($(this).data('toggle')).hide();
            $(this).show();
        });
    });
    // Continue if no change detected
    socket.on('continue', function() {
        $('.button-make').each(function() {
            $($(this).data('toggle')).hide();
            $(this).show();
        });
    });
    // Account management button
    socket.on('account-management', function(action) {
        $('a.account-management').html(action.html).attr('href', action.href);
    });
    // Profile information
    socket.on('profile-info', function(name, picture) {
        let $info = $('li.profile-info');
        $info.find('.profile-name').html(name);
        $info.find('.profile-picture').attr('src', picture);
        $info.show();
    });
    // Load input if logged in
    socket.on('load-input', function(data) {
        $('.form-editor').each(function() {
            let key = $(this).attr('id');
            let mem = {};
            $(this).find('input').each(function() {
                let name = $(this).attr('name');
                let val;
                if (Array.isArray(data[key][name])) {
                    if (name in mem) {
                        mem[name]++;
                    } else {
                        mem[name] = 0;
                    }
                    val = data[key][name][mem[name]];
                } else {
                    val = data[key][name];
                }
                if (val !== '') $(this).attr('required', 'required');
                $(this).val(val);
            });
        });
    });
});

/*
 * Background animation
 */
const debounce = (func, wait, immediate) => {
    let timeout;
    return function() {
        let context = this, args = arguments;
        let later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

window.requestAnimFrame = (() =>{
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

let c = document.createElement("canvas");
c.className = 'bg';
document.body.appendChild(c);

const getContext = () => {
    let ctx = c.getContext("2d");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    let cubes = [],
        //more spacing less squares
        spacing = 30,
        xPos = 0,
        n = window.innerWidth / spacing,
        tSpeedFactor = [.2, .4, .6, .8, 1],
        i;

    const colors = ['#a5dff9', '#ef5285', '#feee7d'];

    for (i = 0; i < n; i++) {
        cubes.push({
            x: xPos,
            y: Math.round(Math.random() * c.height),
            width: Math.round(Math.random() * 10) * 2,
            tSpeed: tSpeedFactor[Math.floor(Math.random() * tSpeedFactor.length)],
            color: colors[Math.floor(Math.random() * colors.length)],
            angle: 0,
            upDownFactor: (Math.random() >= .5) ? 1 : -1
        });
        xPos += spacing;
    }

    const draw = () => {
        let i;
        ctx.clearRect(0, 0, c.width, c.height);
        for (i = 0; i < n; i++) {
            ctx.save();
            ctx.translate(cubes[i].x + cubes[i].width / 2, cubes[i].y + cubes[i].width / 2);
            ctx.rotate(cubes[i].angle);
            ctx.fillStyle = cubes[i].color;
            ctx.globalAlpha = 1;
            ctx.fillRect(-cubes[i].width / 2, -cubes[i].width / 2, cubes[i].width, cubes[i].width);
            ctx.restore();
            cubes[i].y = cubes[i].y + cubes[i].tSpeed * cubes[i].upDownFactor;
            cubes[i].angle += Math.PI / 360;
            if (cubes[i].upDownFactor === -1) {
                if (cubes[i].y + cubes[i].width < 0) {
                    cubes[i].y = c.height;
                }
            } else if (cubes[i].upDownFactor === 1) {
                if (cubes[i].y >= c.height) {
                    cubes[i].y = -cubes[i].width;
                }
            }
        }
        window.requestAnimationFrame(draw);
    };
    draw();
};
getContext();
window.addEventListener('resize', debounce(getContext, 500));